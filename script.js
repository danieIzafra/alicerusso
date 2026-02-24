// ==========================================
// 1. Animações de Scroll (Fade In)
// ==========================================
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
});
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ==========================================
// 2. Tabs e Tema
// ==========================================
function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(el => { el.style.display = "none"; el.classList.remove("active"); });
    document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
    const currentTab = document.getElementById(tabName);
    currentTab.style.display = "block";
    setTimeout(() => currentTab.classList.add("active"), 10);
    evt.currentTarget.classList.add("active");
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const icon = document.querySelector('#theme-toggle i');
    icon.classList.toggle('fa-moon'); icon.classList.toggle('fa-sun');
});

// ==========================================
// Funções Auxiliares de Tempo
// ==========================================
function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number); return h * 60 + m;
}
function parseDuracao(str) {
    let min = 0;
    const hM = str.match(/(\d+)\s*h/i); const mM = str.match(/(\d+)\s*m/i);
    if (hM) min += parseInt(hM[1]) * 60; if (mM) min += parseInt(mM[1]);
    return min > 0 ? min : 60;
}

// ==========================================
// FIREBASE LOGIC (Carrega 1 segundo após a página)
// ==========================================
setTimeout(async () => {
    const db = window.db;
    const { collection, getDocs, addDoc, doc, getDoc, query, where } = window.firestoreTools;

    // 1. Carregar Serviços e Galeria da Nuvem
    async function carregarDadosDoSite() {
        const servicosSnap = await getDocs(collection(db, "servicos"));
        const galeriaSnap = await getDocs(collection(db, "galeria"));
        
        // Guarda os serviços globalmente para a lógica do formulário usar sem ter que buscar na nuvem de novo
        window.servicosGlobais = servicosSnap.docs.map(d => d.data()); 
        
        ['cilios', 'lifting', 'fineline'].forEach(cat => {
            const tbody = document.getElementById(`tbody-${cat}`);
            if(!tbody) return;
            tbody.innerHTML = '';
            
            const filtrados = window.servicosGlobais.filter(s => s.categoria === cat);
            
            if(filtrados.length === 0) { 
                tbody.innerHTML = '<tr><td colspan="3">Nenhum serviço disponível no momento.</td></tr>'; 
                return; 
            }
            
            filtrados.forEach(s => {
                tbody.innerHTML += `<tr><td>${s.nome}</td><td>${s.duracao}</td><td>${s.valor}</td></tr>`;
            });
        });

        const gridGaleria = document.getElementById('gallery-grid-client');
        if(gridGaleria) {
            gridGaleria.innerHTML = '';
            if(galeriaSnap.empty) {
                gridGaleria.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Galeria sendo atualizada.</p>';
            } else {
                galeriaSnap.forEach(d => {
                    gridGaleria.innerHTML += `<div class="gallery-item"><img src="${d.data().url}" alt="Arte Luxe Vision"></div>`;
                });
            }
        }
    }

    // 2. Carregar Dias (Pulando folgas configuradas no Admin)
    async function carregarDiasDisponiveis() {
        const docRef = await getDoc(doc(db, "config", "dias"));
        const diasTrabalho = docRef.exists() ? docRef.data().selecionados : [1,2,3,4,5,6];
        
        const container = document.getElementById('date-scroll');
        const inputData = document.getElementById('data');
        if(!container || !inputData) return;

        container.innerHTML = '';
        
        let dataAtual = new Date();
        let add = 0;
        const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        while(add < 15) {
            const diaDaSemana = dataAtual.getDay();
            
            if(diasTrabalho.includes(diaDaSemana)) {
                const dia = dataAtual.getDate().toString().padStart(2, '0');
                const mes = (dataAtual.getMonth()+1).toString().padStart(2, '0');
                const ano = dataAtual.getFullYear();
                const dataStr = `${ano}-${mes}-${dia}`;
                
                const btn = document.createElement('div');
                btn.className = 'date-card';
                btn.innerHTML = `<span class="day-name">${nomesDias[diaDaSemana]}</span><span class="day-num">${dia}</span>`;
                
                btn.onclick = function() {
                    document.querySelectorAll('.date-card').forEach(e => e.classList.remove('active'));
                    this.classList.add('active');
                    inputData.value = dataStr;
                    verificarHorariosFirebase(); // Dispara a verificação
                };
                container.appendChild(btn);
                add++;
            }
            // Avança para o próximo dia no calendário real
            dataAtual.setDate(dataAtual.getDate() + 1);
        }
    }

    // 3. Controle dos Dropdowns de Categorias
    const catSelect = document.getElementById('categoria-agendamento');
    const servSelect = document.getElementById('servico-agendamento');
    
    if (catSelect && servSelect) {
        catSelect.addEventListener('change', (e) => {
            servSelect.innerHTML = '<option value="" disabled selected>Escolha o serviço...</option>';
            const filtrados = (window.servicosGlobais || []).filter(s => s.categoria === e.target.value);
            
            if(filtrados.length > 0) {
                servSelect.disabled = false;
                filtrados.forEach(s => servSelect.innerHTML += `<option value="${s.nome}" data-duracao="${s.duracao}">${s.nome} (${s.duracao})</option>`);
            } else {
                servSelect.disabled = true;
            }
            verificarHorariosFirebase();
        });
        servSelect.addEventListener('change', verificarHorariosFirebase);
    }

    // 4. Bloqueio Inteligente de Horários Checando a Nuvem
    async function verificarHorariosFirebase() {
        const gridHorarios = document.getElementById('grid-horarios-cliente');
        const dataEscolhida = document.getElementById('data').value;
        const servicoEscolhido = servSelect.value;

        if(!dataEscolhida || !servicoEscolhido) {
            gridHorarios.innerHTML = '<p style="grid-column:1/-1; font-size:0.85rem; opacity:0.7;">Selecione o serviço e um dia no calendário acima.</p>';
            return;
        }

        gridHorarios.innerHTML = '<p style="grid-column:1/-1; color:var(--gold);">Buscando horários disponíveis na nuvem...</p>';

        const duracao = parseDuracao(servSelect.options[servSelect.selectedIndex].getAttribute('data-duracao'));
        
        // Puxa horários base
        const horSnap = await getDocs(collection(db, "horarios"));
        const horariosBase = horSnap.docs.map(d => d.data().horario).sort();

        // Puxa agendamentos SOMENTE do dia selecionado
        const q = query(collection(db, "agendamentos"), where("data", "==", dataEscolhida));
        const agSnap = await getDocs(q);
        const agendamentosDoDia = agSnap.docs.map(d => d.data());

        gridHorarios.innerHTML = '';
        let temVaga = false;

        horariosBase.forEach(horCandidato => {
            const inicioCand = timeToMinutes(horCandidato);
            const fimCand = inicioCand + duracao;
            let conflito = false;

            for(let ag of agendamentosDoDia) {
                const inicioAg = timeToMinutes(ag.horario);
                const fimAg = inicioAg + ag.duracaoMinutos;
                
                // Lógica de colisão de tempo
                if(inicioCand < fimAg && fimCand > inicioAg) {
                    conflito = true; 
                    break;
                }
            }

            if(!conflito) {
                temVaga = true;
                gridHorarios.innerHTML += `<label class="time-slot"><input type="radio" name="horario" value="${horCandidato}" required><span>${horCandidato}</span></label>`;
            }
        });

        if(!temVaga) {
            gridHorarios.innerHTML = '<p style="color:#d9534f; grid-column:1/-1;">Sem horários suficientes para a duração deste serviço neste dia.</p>';
        }
    }

    // 5. Envio do Formulário (Firebase + EmailJS)
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('form-status');
            const btnSubmit = e.target.querySelector('button[type="submit"]');
            
            const nome = document.getElementById('nome').value;
            const data = document.getElementById('data').value;
            const hrInput = document.querySelector('input[name="horario"]:checked');

            if(!data || !hrInput) {
                status.textContent = "Por favor, selecione uma data e um horário disponível.";
                status.style.color = "#d9534f";
                return;
            }
            
            btnSubmit.textContent = "Processando Reserva...";
            btnSubmit.disabled = true;

            try {
                const horario = hrInput.value;
                const servico = servSelect.value;
                const duracao = parseDuracao(servSelect.options[servSelect.selectedIndex].getAttribute('data-duracao'));

                // 1. SALVA NO FIREBASE
                await addDoc(collection(db, "agendamentos"), {
                    nome, 
                    servico, 
                    data, 
                    horario, 
                    duracaoMinutos: duracao, 
                    dataTimestamp: new Date()
                });

                // 2. DISPARA E-MAIL (Lembre-se de colocar seus IDs do EmailJS aqui)
                try {
                    await emailjs.send("service_dl81cjf", "template_k2v79", {
                        nome: nome, 
                        servico: servico, 
                        horario: horario,
                        data: data.split('-').reverse().join('/') // Converte de YYYY-MM-DD para DD/MM/YYYY
                    });
                } catch (emailError) {
                    console.error("Erro não-impeditivo: Falha ao enviar emailJS.", emailError);
                    // Não travamos o fluxo se o e-mail falhar, pois o agendamento já está salvo no BD.
                }

                // 3. Imagem aleatória e Feedback
                const randomNum = Math.floor(Math.random() * 1000);
                const response = await fetch(`https://picsum.photos/seed/${randomNum}/400/300`);
                const imageBlob = await response.blob();
                const imageObjectURL = URL.createObjectURL(imageBlob);

                status.innerHTML = `Sucesso, ${nome}! <strong>${servico}</strong> reservado com sucesso.<br><br><strong>Uma inspiração para você:</strong>`;
                status.style.color = "var(--gold)";
                
                const randomImage = document.createElement('img');
                randomImage.src = imageObjectURL;
                randomImage.style.cssText = "width: 100%; border-radius: 4px; margin-top: 20px; border: 1px solid var(--border-color); animation: fadeIn 0.5s ease;";

                const existingImg = status.nextElementSibling;
                if(existingImg && existingImg.tagName === 'IMG') existingImg.remove();
                
                status.parentNode.insertBefore(randomImage, status.nextSibling);
                
                // 4. Resetar a UI
                e.target.reset();
                servSelect.disabled = true;
                document.querySelectorAll('.date-card').forEach(el => el.classList.remove('active'));
                document.getElementById('data').value = '';
                document.getElementById('grid-horarios-cliente').innerHTML = '';
                
            } catch(err) {
                console.error("Erro Crítico no Agendamento:", err);
                status.textContent = "Ocorreu um erro ao comunicar com a nuvem. Tente novamente.";
                status.style.color = "#d9534f";
            } finally {
                btnSubmit.textContent = "Confirmar Solicitação";
                btnSubmit.disabled = false;
            }
        });
    }

    // Inicializa a leitura de dados
    carregarDadosDoSite();
    carregarDiasDisponiveis();

}, 1000); // Aguarda o Firebase ser injetado no Window