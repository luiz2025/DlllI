document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores Globais ---
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');

    const sidebar = document.getElementById('sidebar-menu');
    const mainContent = document.getElementById('main-content');
    const menuToggleBtn = document.querySelector('.menu-btn');
    const closeMenuBtn = sidebar?.querySelector('.close-btn'); // Adicionado '?' para segurança
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const navLinks = document.querySelectorAll('.nav-link'); // Links que mudam página via data-target
    const sidebarLinks = sidebar?.querySelectorAll('.menu-item[data-target]');
    const logoutBtn = document.getElementById('logout-btn');

    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');
    const quickRepliesContainer = document.getElementById('chatbot-quick-replies');
    const activityTitle = document.getElementById('activity-title');

    const exerciseContainers = document.querySelectorAll('.exercise-card');
    const exerciseTitle = document.getElementById('exercise-title');

    const gesturePage = document.getElementById('gesture-page');
    const gestureCard = document.getElementById('gesture-card');
    const webcamFeed = document.getElementById('webcam-feed');
    const webcamStatus = document.getElementById('webcam-status');
    const startCamBtn = document.getElementById('start-cam-btn');
    const stopCamBtn = document.getElementById('stop-cam-btn');
    const checkGestureBtn = document.getElementById('check-gesture-btn');
    const targetGestureEl = document.getElementById('target-gesture');
    const gestureFeedbackEl = document.getElementById('gesture-feedback');

    const settingsForm = document.getElementById('ranking-settings-form');
    const savePrefsBtn = document.getElementById('save-prefs-btn');
    const defaultThemeSelect = document.getElementById('default-theme');

    // --- Estado da Aplicação ---
    let currentTheme = localStorage.getItem('theme') || 'light';
    let currentPageId = 'login-page'; // Começa no login
    let webcamStream = null; // Armazena o stream da webcam
    let currentGestureChallenge = 'A'; // Gesto atual para praticar
    const gestureSequence = ['A', 'B', 'C', 'D', 'E', 'L', 'I', 'O']; // Sequência de gestos
    let gestureIndex = 0;
    let currentChatbotContext = null; // Para respostas mais contextuais

    // --- Dados (Simulação de Backend/Banco de Dados) ---
    const usuariosValidos = { "luiz": "1234" };
    const modulosInfo = {
        "m1": { nome: "M1: Alfabeto", desc: "Introdução às letras A-Z do alfabeto manual.", conteudo: ["Letras A-G", "Letras H-N", "Letras O-U", "Letras V-Z", "Exercício Prático Alfabeto"], atividadeInicial: "alfabeto_intro", exercicioId: "alfabeto" },
        "m2": { nome: "M2: Números", desc: "Aprenda os números cardinais básicos (0-100).", conteudo: ["Números 0-10", "Números 11-20", "Dezenas", "Exercício Prático Números"], atividadeInicial: "numeros_intro", exercicioId: "numeros" },
        "m3": { nome: "M3: Cumprimentos", desc: "Saudações (Oi, Tchau) e frases básicas (Tudo bem?).", conteudo: ["Oi / Olá", "Tchau", "Tudo bem?", "Bom dia / Boa tarde / Boa noite", "Exercício Prático Cumprimentos"], atividadeInicial: "cumprimentos_intro", exercicioId: "cumprimentos" },
        "m4": { nome: "M4: Família", desc: "Sinais para Pai, Mãe, Irmão, etc.", conteudo: ["Pai / Mãe", "Irmão / Irmã", "Filho / Filha", "Avô / Avó", "Exercício Prático Família"], atividadeInicial: "familia_intro", exercicioId: "familia" },
        // Adicionar mais módulos aqui...
    };

    // --- Funções ---

    // Aplicar Tema (Light/Dark)
    const applyTheme = (theme) => {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(theme === 'dark' ? 'dark-mode' : 'light-mode');
        currentTheme = theme;
        localStorage.setItem('theme', theme);
        if (defaultThemeSelect) defaultThemeSelect.value = theme; // Atualiza select nas config
    };

    // Parar Câmera (se estiver ativa)
    const stopCamera = () => {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
            if (webcamFeed) webcamFeed.srcObject = null;
            if (webcamStatus) webcamStatus.textContent = "Câmera desligada.";
            if (startCamBtn) startCamBtn.classList.remove('hidden');
            if (stopCamBtn) stopCamBtn.classList.add('hidden');
            if (checkGestureBtn) checkGestureBtn.classList.add('hidden');
            if (gestureCard) gestureCard.classList.remove('camera-active');
            if (gestureFeedbackEl) gestureFeedbackEl.textContent = ''; // Limpa feedback
            console.log("Câmera parada.");
        }
    };

     // Mostrar Página Específica
    const showPage = (pageId) => {
        if (currentPageId === 'gesture-page' && pageId !== 'gesture-page') {
            stopCamera(); // Para a câmera ao sair da página de gestos
        }

        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
            page.classList.add('hidden');
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            targetPage.classList.add('active');
            currentPageId = pageId; // Atualiza página atual
            window.scrollTo(0, 0); // Rola para o topo
            updateActiveSidebarLink(pageId); // Atualiza link ativo no menu
        } else {
            console.error(`Page with ID "${pageId}" not found.`);
            showPage('home-screen'); // Fallback para home
        }
    };

    // Atualizar link ativo na Sidebar
    const updateActiveSidebarLink = (targetPageId) => {
        if (!sidebarLinks) return;
        sidebarLinks.forEach(link => {
            if (link.dataset.target === targetPageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    // Abrir/Fechar Menu Lateral (Função Global `toggleMenu` no HTML chama esta)
    window.toggleMenu = () => { // Torna acessível globalmente
        document.body.classList.toggle('sidebar-open');
    };

    // Simulação de Login
    const handleLogin = (event) => {
        event.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (usuariosValidos[username] && usuariosValidos[username] === password) {
            loginMessage.textContent = 'Login bem-sucedido! Redirecionando...';
            loginMessage.style.color = 'var(--success-color)';
            setTimeout(() => {
                loginPage.classList.remove('active');
                loginPage.classList.add('hidden');
                mainApp.classList.remove('hidden');
                mainApp.classList.add('active');
                showPage('home-screen');
                loginMessage.textContent = '';
            }, 1000);
        } else {
            loginMessage.textContent = 'Usuário ou senha inválidos.';
            loginMessage.style.color = 'var(--danger-color)';
            passwordInput.value = '';
            usernameInput.focus();
        }
    };

    // Logout
    const handleLogout = () => {
         stopCamera(); // Garante que a câmera pare no logout
         mainApp.classList.add('hidden');
         mainApp.classList.remove('active');
         loginPage.classList.remove('hidden');
         loginPage.classList.add('active');
         if(loginForm) loginForm.reset();
         if(loginMessage) loginMessage.textContent = '';
         currentPageId = 'login-page'; // Reseta página atual
         if(document.body.classList.contains('sidebar-open')) {
             window.toggleMenu(); // Usa a função global
         }
         console.log("Usuário deslogado.");
    };

    // --- Funções do Chatbot ---
    const addChatMessage = (text, type = 'bot') => {
        if (!chatbotMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type === 'user' ? 'user-message' : 'bot-message');
        messageDiv.textContent = text; // Usar textContent é mais seguro que innerHTML
        chatbotMessages.appendChild(messageDiv);
        // Scroll para a última mensagem
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    };

    const showQuickReplies = (replies) => {
        if (!quickRepliesContainer) return;
        quickRepliesContainer.innerHTML = ''; // Limpa anteriores
        if (replies && replies.length > 0) {
            replies.forEach(reply => {
                const button = document.createElement('button');
                button.classList.add('quick-reply-btn');
                button.textContent = reply.label;
                button.onclick = () => handleQuickReply(reply);
                quickRepliesContainer.appendChild(button);
            });
            quickRepliesContainer.style.display = 'flex'; // Garante visibilidade
        } else {
             quickRepliesContainer.style.display = 'none'; // Esconde se não houver botões
        }
    };

    const handleQuickReply = (reply) => {
        addChatMessage(reply.label, 'user'); // Mostra a escolha do usuário
        showQuickReplies([]); // Esconde os botões após clique
        // Processa a ação ou texto da resposta rápida
        if (reply.action) {
            // Executa uma ação específica (ex: iniciar próxima lição)
            processChatbotInput(reply.action, true); // Passa flag indicando ação
        } else {
            // Simula a digitação do texto da resposta
            processChatbotInput(reply.text || reply.label);
        }
    };


    const processChatbotInput = (userInput, isAction = false) => {
        let response = "Desculpe, não entendi bem. Poderia reformular?";
        const lowerInput = userInput.toLowerCase();
        let quickReplies = []; // Respostas rápidas para a próxima interação

        // Lógica mais elaborada - depende do contexto atual
        switch (currentChatbotContext) {
            case 'alfabeto_intro':
                if (lowerInput.includes('sim') || lowerInput.includes('começar') || lowerInput.includes('pronto')) {
                    response = "Ótimo! Vamos começar com as primeiras letras: A, B, C. O gesto para 'A' é assim: [Imagine uma imagem/gif do gesto A]. Tente fazer!";
                    quickReplies = [
                        { label: "Entendi", text: "mostre a letra B" },
                        { label: "Repetir 'A'", text: "explique A de novo" },
                        { label: "Preciso de ajuda", text: "ajuda com o alfabeto" }
                    ];
                    currentChatbotContext = 'alfabeto_a'; // Próximo estado
                } else if (lowerInput.includes('não') || lowerInput.includes('ainda não')) {
                    response = "Tudo bem! Quando estiver pronto, é só dizer 'sim'.";
                     quickReplies = [{ label: "Estou pronto!", text: "sim" }];
                } else {
                     response = "Responda com 'sim' para começarmos a lição do alfabeto, por favor.";
                     quickReplies = [{ label: "Sim, começar", text: "sim" }];
                }
                break;

            case 'alfabeto_a':
                 if (lowerInput.includes('mostre a letra b') || lowerInput.includes('próximo')) {
                    response = "Perfeito! Agora a letra 'B': [Imagine uma imagem/gif do gesto B]. Note a posição dos dedos. Pratique um pouco.";
                     quickReplies = [
                        { label: "Mostrar 'C'", text: "mostre a letra C" },
                        { label: "Voltar para 'A'", text: "mostre A" },
                    ];
                     currentChatbotContext = 'alfabeto_b';
                 } else if (lowerInput.includes('explique a de novo') || lowerInput.includes('mostre a')) {
                     response = "Claro! A letra 'A' é com a mão fechada, polegar ao lado do indicador: [Imagem/gif A]. Fácil, né?";
                     quickReplies = [{ label: "Entendi, mostrar 'B'", text: "mostre B" }];
                 } else {
                     response = "Você entendeu o gesto 'A'? Diga 'mostrar B' para continuar ou 'explique A de novo'.";
                     quickReplies = [
                        { label: "Mostrar 'B'", text: "mostre B" },
                        { label: "Explique 'A' de novo", text: "explique A de novo" },
                    ];
                 }
                break;

             case 'alfabeto_b':
                 if (lowerInput.includes('mostre a letra c') || lowerInput.includes('próximo')) {
                    response = "Excelente! A letra 'C' parece a própria letra formada com a mão: [Imagine uma imagem/gif do gesto C].";
                     quickReplies = [
                        { label: "Revisar A, B, C", text: "revisar abc" },
                        { label: "Ir para Exercício", action: "start_exercise_m1" }, // Ação customizada
                    ];
                     currentChatbotContext = 'alfabeto_c';
                 } else if (lowerInput.includes('mostre b') || lowerInput.includes('repetir b')) {
                     response = "A letra 'B' é com a palma para frente, dedos juntos e esticados, polegar dobrado na frente: [Imagem/gif B].";
                     quickReplies = [{ label: "Ok, mostrar 'C'", text: "mostre C" }];
                 }
                 // Adicionar mais estados (alfabeto_c, etc.)
                break;

            // Adicionar casos para outros contextos (numeros_intro, cumprimentos_intro, etc.)

            default: // Sem contexto específico ou saudação inicial
                 if (isAction && userInput === 'start_exercise_m1') {
                    response = "Ok! Vamos para os exercícios do Módulo 1.";
                    // Ação real de navegar para exercícios
                    setTimeout(() => showPage('exercises-page'), 1000); // Pequeno delay
                    // Poderia filtrar exercícios aqui se necessário
                 }
                 else if (lowerInput.includes('olá') || lowerInput.includes('oi') || lowerInput.includes('bom dia')) {
                    response = "Olá! Bem-vindo ao Dilli. Pronto para aprender Libras hoje?";
                    quickReplies = [
                        { label: "Sim, começar!", text: "sim" },
                        { label: "Ver meus módulos", action: "show_modules" }
                    ];
                    currentChatbotContext = 'saudacao'; // Define um contexto inicial
                 } else if (lowerInput.includes('ajuda')) {
                     response = "Como posso te ajudar? Você pode pedir para:\n- Iniciar um módulo ('iniciar módulo 1')\n- Praticar gestos ('praticar gestos')\n- Fazer exercícios ('fazer exercícios')";
                      quickReplies = [
                        { label: "Iniciar Módulo 1", text: "iniciar m1" },
                        { label: "Praticar Gestos", action: "show_gesture_page" }
                    ];
                 }
                 // Ações especiais
                 else if (isAction && userInput === 'show_modules') {
                     response = "Claro, mostrando seus módulos.";
                     setTimeout(() => showPage('libras-modules-page'), 500);
                 } else if (isAction && userInput === 'show_gesture_page') {
                     response = "Ok, vamos praticar os gestos!";
                     setTimeout(() => showPage('gesture-page'), 500);
                 }
                 // Resposta genérica se nada for reconhecido
                 else {
                     response = "Hum... não tenho certeza do que fazer com isso. Tente pedir 'ajuda' ou iniciar uma lição.";
                 }
        }

        // Adiciona a resposta do bot com um pequeno delay
        setTimeout(() => {
            addChatMessage(response, 'bot');
            showQuickReplies(quickReplies); // Mostra as respostas rápidas para a próxima etapa
        }, 600); // Delay para simular "pensamento"
    };

     // Enviar Mensagem no Chatbot (Input ou Botão)
    const handleChatSend = () => {
        if (!chatbotInput) return;
        const text = chatbotInput.value.trim();
        if (text) {
            addChatMessage(text, 'user'); // Mostra mensagem do usuário
            showQuickReplies([]); // Limpa respostas rápidas antigas
            processChatbotInput(text); // Processa a entrada
            chatbotInput.value = ''; // Limpa o campo de input
            chatbotInput.focus(); // Mantém o foco no input
        }
    };

    // Iniciar Chat de um Módulo Específico
    const startModuleActivity = (moduleId) => {
        const module = modulosInfo[moduleId];
        if (module && module.atividadeInicial) {
            if (activityTitle) activityTitle.textContent = `Atividade: ${module.nome}`;
            currentChatbotContext = module.atividadeInicial; // Define o contexto inicial
            chatbotMessages.innerHTML = ''; // Limpa chat anterior
            addChatMessage(`Iniciando atividade do ${module.nome}!`, 'bot');
            processChatbotInput('iniciar'); // Envia um gatilho inicial para o contexto
        } else {
             addChatMessage("Desculpe, não encontrei uma atividade inicial para este módulo.", 'bot');
             currentChatbotContext = null; // Reseta contexto
        }
    }


    // --- Funções de Exercícios ---
    const handleMcqInteraction = (event) => {
        const target = event.target.closest('.option-btn');
        if (!target) return;

        const optionsContainer = target.closest('.mcq-options');
        const exerciseCard = target.closest('.exercise-card');
        const feedbackEl = exerciseCard.querySelector('.feedback');
        const correctAnswer = optionsContainer.dataset.correct;
        const selectedOption = target.dataset.option;

        // Verifica se já respondeu
        if (optionsContainer.dataset.answered === 'true') {
            feedbackEl.textContent = "Você já respondeu esta questão.";
            feedbackEl.style.color = 'var(--warning-color)';
            return;
        }

        // Marca como respondido e desabilita botões
        optionsContainer.dataset.answered = 'true';
        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true; // Desabilita todos
            btn.classList.remove('selected'); // Limpa seleção anterior visual
        });

        // Marca o botão selecionado
        target.classList.add('selected');

        // Verifica e dá feedback
        if (selectedOption === correctAnswer) {
            target.classList.add('correct');
            feedbackEl.textContent = 'Correto! Muito bem! 🎉';
            feedbackEl.className = 'feedback correct'; // Usa classe para cor
        } else {
            target.classList.add('incorrect');
            feedbackEl.textContent = `Incorreto. A resposta certa era a opção ${correctAnswer.replace('option','')}.`;
            feedbackEl.className = 'feedback incorrect';
            // Destaca a resposta correta
            const correctBtn = optionsContainer.querySelector(`[data-option="${correctAnswer}"]`);
            if (correctBtn) {
                 correctBtn.classList.add('correct'); // Mostra qual era a correta
                 correctBtn.style.borderWidth = '3px'; // Destaca mais
            }
        }
    };

    const handleMatchVerification = (inputId, feedbackId) => {
        const input = document.getElementById(inputId);
        const feedbackEl = document.getElementById(feedbackId);
        if (!input || !feedbackEl) return;

        const userAnswer = input.value.trim().toUpperCase();
        const correctAnswer = input.dataset.correct.toUpperCase();

        input.disabled = true; // Desabilita após verificar
        const verifyBtn = input.closest('.exercise-card').querySelector('.btn-verify');
        if(verifyBtn) verifyBtn.disabled = true;

        if (userAnswer === correctAnswer) {
            feedbackEl.textContent = 'Correto! 👍';
            feedbackEl.className = 'feedback correct';
            input.style.borderColor = 'var(--success-color)';
        } else {
            feedbackEl.textContent = `Incorreto. A resposta era '${correctAnswer}'.`;
            feedbackEl.className = 'feedback incorrect';
            input.style.borderColor = 'var(--danger-color)';
        }
    };

    // Resetar estado dos exercícios ao entrar na página
    const resetExercises = () => {
        exerciseContainers.forEach(card => {
            const feedback = card.querySelector('.feedback');
            if(feedback) feedback.textContent = '';

            // Reset MCQ
            const mcqOptions = card.querySelector('.mcq-options');
            if(mcqOptions) {
                mcqOptions.dataset.answered = 'false';
                mcqOptions.querySelectorAll('.option-btn').forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('selected', 'correct', 'incorrect');
                    btn.style.borderWidth = ''; // Reseta destaque
                });
            }

            // Reset Match Input
            const matchInput = card.querySelector('input[type="text"][data-correct]');
             if(matchInput) {
                matchInput.disabled = false;
                matchInput.value = '';
                matchInput.style.borderColor = '';
            }
             const verifyBtn = card.querySelector('.btn-verify');
             if(verifyBtn) verifyBtn.disabled = false;
        });
         // Define título padrão ou baseado em módulo (precisaria de lógica adicional)
         if(exerciseTitle) exerciseTitle.textContent = "Exercícios Gerais";
    };

    // --- Funções da Câmera e Gestos ---

    // Iniciar Câmera
    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); // Pede câmera frontal
                if (webcamFeed) {
                    webcamFeed.srcObject = webcamStream;
                    webcamFeed.onloadedmetadata = () => { // Garante que metadados carregaram
                        webcamFeed.play(); // Inicia o vídeo
                        if (webcamStatus) webcamStatus.textContent = "Câmera Ativa";
                        if (startCamBtn) startCamBtn.classList.add('hidden');
                        if (stopCamBtn) stopCamBtn.classList.remove('hidden');
                        if (checkGestureBtn) checkGestureBtn.classList.remove('hidden');
                        if (gestureCard) gestureCard.classList.add('camera-active');
                        if (gestureFeedbackEl) gestureFeedbackEl.textContent = ''; // Limpa feedback anterior
                        targetGestureEl.textContent = gestureSequence[gestureIndex]; // Define o primeiro desafio
                        console.log("Câmera iniciada com sucesso.");
                    };
                }
            } catch (error) {
                console.error("Erro ao acessar a câmera:", error);
                let message = "Erro ao acessar a câmera.";
                if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                    message = "Permissão para câmera negada. Habilite nas configurações do navegador.";
                } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                    message = "Nenhuma câmera encontrada.";
                }
                if (webcamStatus) webcamStatus.textContent = message;
                if (gestureFeedbackEl) {
                    gestureFeedbackEl.textContent = message;
                    gestureFeedbackEl.className = 'feedback incorrect';
                }
                // Garante que botões de controle fiquem escondidos se falhar
                if (stopCamBtn) stopCamBtn.classList.add('hidden');
                if (checkGestureBtn) checkGestureBtn.classList.add('hidden');
                if (startCamBtn) startCamBtn.classList.remove('hidden'); // Mostra botão de iniciar novamente

            }
        } else {
            console.error("getUserMedia não é suportado neste navegador.");
             if (webcamStatus) webcamStatus.textContent = "Seu navegador não suporta acesso à câmera.";
             if (gestureFeedbackEl) gestureFeedbackEl.textContent = "Funcionalidade de câmera não suportada.";
        }
    };

    // Simular Verificação de Gesto
    const simulateGestureCheck = () => {
        if (!gestureFeedbackEl || !targetGestureEl) return;

        // Simulação: 60% de chance de acertar
        const isCorrect = Math.random() < 0.6;

        if (isCorrect) {
            gestureFeedbackEl.textContent = `Correto! Você fez o gesto "${currentGestureChallenge}"! 👍`;
            gestureFeedbackEl.className = 'feedback correct';

            // Avança para o próximo gesto na sequência
            gestureIndex = (gestureIndex + 1) % gestureSequence.length;
            currentGestureChallenge = gestureSequence[gestureIndex];

            // Atualiza o desafio após um pequeno delay
            setTimeout(() => {
                targetGestureEl.textContent = currentGestureChallenge;
                gestureFeedbackEl.textContent = ''; // Limpa feedback para o próximo
            }, 1500); // Espera 1.5s

        } else {
            gestureFeedbackEl.textContent = `Quase lá! Tente o gesto "${currentGestureChallenge}" novamente. 🤔`;
            gestureFeedbackEl.className = 'feedback incorrect';
            // Não avança, deixa o usuário tentar o mesmo gesto de novo
        }
    };

    // --- Funções de Configurações ---
    const saveRankingSettings = (event) => {
         event.preventDefault();
         console.log("Salvando configurações de ranking (simulado)...");
         // Pegar valores:
         const showRanking = document.getElementById('show-ranking')?.checked;
         const privacy = document.getElementById('ranking-privacy')?.value;
         console.log("Mostrar no ranking:", showRanking, "Privacidade:", privacy);
         // Adicionar feedback visual
         const saveBtn = settingsForm.querySelector('button[type="submit"]');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
            saveBtn.disabled = true;
            setTimeout(() => {
                 saveBtn.innerHTML = originalText;
                 saveBtn.disabled = false;
            }, 2000);
    };

    const saveAccountPreferences = () => {
        console.log("Salvando preferências da conta (simulado)...");
        const selectedTheme = defaultThemeSelect?.value || 'light';
        localStorage.setItem('theme', selectedTheme); // Salva tema padrão
        applyTheme(selectedTheme); // Aplica imediatamente
        console.log("Tema padrão salvo:", selectedTheme);
         // Adicionar feedback visual
         const originalText = savePrefsBtn.innerHTML;
         savePrefsBtn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
         savePrefsBtn.disabled = true;
         setTimeout(() => {
             savePrefsBtn.innerHTML = originalText;
             savePrefsBtn.disabled = false;
         }, 2000);
    };


    // --- Inicialização e Event Listeners ---

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else if (mainApp && !mainApp.classList.contains('hidden')) {
        // Se não tem form de login, mas app principal está visível,
        // assume que já está "logado" (ex: refresh da página)
        console.log("App principal já ativa, mostrando home.");
        showPage('home-screen');
    }

    // Toggle Tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }

    // Navegação (Sidebar e Links .nav-link)
    const handleNavigation = (event) => {
         event.preventDefault();
         const target = event.target.closest('[data-target]'); // Encontra o link clicado ou seu pai com data-target
         if (!target || !target.dataset.target) return;

         const targetPageId = target.dataset.target;

         // Ações específicas antes de navegar
         if (targetPageId === 'module-detail-placeholder') {
             const moduleId = target.dataset.moduleId;
             const module = modulosInfo[moduleId];
             if (module) {
                document.getElementById('module-detail-title').textContent = `Detalhes: ${module.nome}`;
                document.getElementById('module-detail-name').textContent = module.nome;
                document.getElementById('module-detail-description').textContent = module.desc;
                const contentList = document.getElementById('module-detail-content-list');
                contentList.innerHTML = ''; // Limpa lista anterior
                module.conteudo.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    contentList.appendChild(li);
                });
                // Configura botões para iniciar atividade/exercício do módulo específico
                const activityBtn = document.querySelector('#module-detail-placeholder .btn-start-activity');
                const exerciseBtn = document.querySelector('#module-detail-placeholder .btn-start-exercise');
                if(activityBtn) activityBtn.onclick = () => { startModuleActivity(moduleId); showPage('activities-page'); };
                if(exerciseBtn) exerciseBtn.onclick = () => { /* Lógica para carregar exercícios do módulo */ showPage('exercises-page'); };

             } else {
                 console.warn("Detalhes do módulo não encontrados para:", moduleId);
             }
         } else if (targetPageId === 'activities-page') {
             // Se for navegação genérica para atividades, iniciar a padrão ou a última
             // Se veio de um botão específico de módulo, a função startModuleActivity já cuidou
             if (!currentChatbotContext) { // Só inicia se não houver contexto ativo
                 startModuleActivity('m1'); // Inicia Módulo 1 por padrão
             }
         } else if (targetPageId === 'exercises-page') {
             resetExercises(); // Reseta os exercícios ao entrar na página
             // Adicionar lógica para carregar exercícios específicos do módulo se necessário
         }


         // Navega para a página
         showPage(targetPageId);

         // Fecha o menu lateral se estiver aberto em telas menores
         if (window.innerWidth <= 768 && document.body.classList.contains('sidebar-open')) {
             window.toggleMenu();
         }
    };

    if(sidebar) sidebar.addEventListener('click', handleNavigation);
    if(mainContent) mainContent.addEventListener('click', (e) => {
         // Handle navigation links INSIDE main content
         if (e.target.closest('.nav-link[data-target]')) {
             handleNavigation(e);
         }
         // Fecha menu ao clicar fora (no overlay)
         if (document.body.classList.contains('sidebar-open') && e.target === mainContent) {
            // Esta condição pode não funcionar bem com o overlay ::before
            // Alternativa: Adicionar um div de overlay explícito ou checar se o clique não foi no sidebar
         }
    });
     // Fechar overlay clicando nele (se usar ::before, isso é mais complexo)
     // Se usar div de overlay: overlayDiv.addEventListener('click', toggleMenu);

    // Logout
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Chatbot
    if (chatbotSendBtn) chatbotSendBtn.addEventListener('click', handleChatSend);
    if (chatbotInput) chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleChatSend();
        }
    });

    // Exercícios - Adiciona listeners dinamicamente
    exerciseContainers.forEach(container => {
        const mcqOptions = container.querySelector('.mcq-options');
        if (mcqOptions) {
            mcqOptions.addEventListener('click', handleMcqInteraction);
        }

        const verifyBtn = container.querySelector('.btn-verify');
        if (verifyBtn) {
             const inputId = container.querySelector('input[type="text"][data-correct]')?.id;
             const feedbackId = container.querySelector('.feedback')?.id;
             if(inputId && feedbackId) {
                 verifyBtn.addEventListener('click', () => handleMatchVerification(inputId, feedbackId));
             }
        }
    });

    // Câmera e Gestos
    if (startCamBtn) startCamBtn.addEventListener('click', startCamera);
    if (stopCamBtn) stopCamBtn.addEventListener('click', stopCamera);
    if (checkGestureBtn) checkGestureBtn.addEventListener('click', simulateGestureCheck);


    // Configurações
    if (settingsForm) settingsForm.addEventListener('submit', saveRankingSettings);
    if (savePrefsBtn) savePrefsBtn.addEventListener('click', saveAccountPreferences);


    // --- Inicialização Final ---
    applyTheme(currentTheme); // Aplica tema salvo ou padrão

    // Determina a página inicial (login ou home se app já visível)
    let initialPage = 'login-page';
    if (mainApp && !mainApp.classList.contains('hidden')) {
        initialPage = 'home-screen';
        loginPage?.classList.add('hidden'); // Garante que login está escondido
    } else {
        mainApp?.classList.add('hidden');
        loginPage?.classList.remove('hidden');
    }
    showPage(initialPage);

    // Adiciona mensagem inicial do chatbot se a página de atividade for a inicial (raro, mas possível)
    if(initialPage === 'activities-page') {
        startModuleActivity('m1'); // Inicia Módulo 1 por padrão
    }

    console.log("Dilli App Inicializado. Página atual:", currentPageId);

}); // Fim DOMContentLoaded