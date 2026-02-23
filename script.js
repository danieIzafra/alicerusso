// ==========================================
// 1. Animações de Scroll (Fade In)
// ==========================================
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); 
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(element => {
    observer.observe(element);
});

// ==========================================
// 2. Lógica das Tabs de Serviços
// ==========================================
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
        tabContents[i].classList.remove("active");
    }

    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove("active");
    }

    const currentTab = document.getElementById(tabName);
    currentTab.style.display = "block";
    
    setTimeout(() => {
        currentTab.classList.add("active");
    }, 10);
    
    evt.currentTarget.classList.add("active");
}

// ==========================================
// 3. Lógica do Theme Toggle (Light/Dark Mode)
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const icon = themeToggleBtn.querySelector('i');
    
    if (body.classList.contains('dark-theme')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// ==========================================
// 4. Integração com os Dados do Admin (Ler Tabelas e Galeria)
// ==========================================
function carregarDadosDoSite() {
    const servicos = JSON.parse(localStorage.getItem('luxe_servicos')) || [];
    const galeria = JSON.parse(localStorage.getItem('luxe_galeria')) || [];

    const tbodyCilios = document.getElementById('tbody-cilios');
    const tbodyLifting = document.getElementById('tbody-lifting');
    const tbodyFineline = document.getElementById('tbody-fineline');

    if (tbodyCilios) tbodyCilios.innerHTML = '';
    if (tbodyLifting) tbodyLifting.innerHTML = '';
    if (tbodyFineline) tbodyFineline.innerHTML = '';

    servicos.forEach(servico => {
        const linhaHTML = `<tr>
            <td>${servico.nome}</td>
            <td>${servico.duracao}</td>
            <td>${servico.valor}</td>
        </tr>`;

        if (servico.categoria === 'cilios' && tbodyCilios) tbodyCilios.innerHTML += linhaHTML;
        else if (servico.categoria === 'lifting' && tbodyLifting) tbodyLifting.innerHTML += linhaHTML;
        else if (servico.categoria === 'fineline' && tbodyFineline) tbodyFineline.innerHTML += linhaHTML;
    });

    if(tbodyCilios && tbodyCilios.innerHTML === '') tbodyCilios.innerHTML = '<tr><td colspan="3">Nenhum serviço cadastrado.</td></tr>';
    if(tbodyLifting && tbodyLifting.innerHTML === '') tbodyLifting.innerHTML = '<tr><td colspan="3">Nenhum serviço cadastrado.</td></tr>';
    if(tbodyFineline && tbodyFineline.innerHTML === '') tbodyFineline.innerHTML = '<tr><td colspan="3">Nenhum serviço cadastrado.</td></tr>';

    const galleryGridClient = document.getElementById('gallery-grid-client');
    if (galleryGridClient) {
        galleryGridClient.innerHTML = '';
        if (galeria.length === 0) {
            galleryGridClient.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Nenhuma imagem na galeria ainda.</p>';
        } else {
            galeria.forEach(img => {
                galleryGridClient.innerHTML += `
                    <div class="gallery-item">
                        <img src="${img.url}" alt="Transformação Luxe Vision">
                    </div>
                `;
            });
        }
    }
}

// ==========================================
// 5. Gerador de Dias (Scroll Horizontal)
// ==========================================
function carregarDiasDisponiveis() {
    const container = document.getElementById('date-scroll');
    const inputData = document.getElementById('data');
    if (!container || !inputData) return;

    container.innerHTML = '';
    
    const diasTrabalho = JSON.parse(localStorage.getItem('luxe_dias_trabalho')) || [1, 2, 3, 4, 5, 6]; 
    const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let dataAtual = new Date();
    let diasAdicionados = 0;
    
    // Procura e gera os próximos 15 dias válidos (pulando as folgas)
    while (diasAdicionados < 15) {
        const diaSemana = dataAtual.getDay(); 
        
        if (diasTrabalho.includes(diaSemana)) {
            const numeroDia = dataAtual.getDate();
            const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0');
            const ano = dataAtual.getFullYear();
            const dataFormatada = `${ano}-${mes}-${numeroDia.toString().padStart(2, '0')}`;
            
            const btn = document.createElement('div');
            btn.className = 'date-card';
            btn.innerHTML = `
                <span class="day-name">${nomesDias[diaSemana]}</span>
                <span class="day-num">${numeroDia.toString().padStart(2, '0')}</span>
            `;
            
            btn.addEventListener('click', function() {
                document.querySelectorAll('.date-card').forEach(el => el.classList.remove('active'));
                this.classList.add('active');
                inputData.value = dataFormatada;
                inputData.dispatchEvent(new Event('change')); // Despoleta atualização dos horários
            });
            
            container.appendChild(btn);
            diasAdicionados++;
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
    }
}

// ==========================================
// Funções Auxiliares de Tempo (Conversão)
// ==========================================
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function parseDuracaoParaMinutos(duracaoStr) {
    let minutos = 0;
    const regexHora = /(\d+)\s*h/i;
    const regexMin = /(\d+)\s*m/i;
    
    const hMatch = duracaoStr.match(regexHora);
    const mMatch = duracaoStr.match(regexMin);
    
    if (hMatch) minutos += parseInt(hMatch[1]) * 60;
    if (mMatch) minutos += parseInt(mMatch[1]);
    
    return minutos > 0 ? minutos : 60;
}

// ==========================================
// 6. Lógica Dinâmica do Agendamento (Bloqueio Inteligente)
// ==========================================
const categoriaSelect = document.getElementById('categoria-agendamento');
const servicoSelect = document.getElementById('servico-agendamento');
const dataInput = document.getElementById('data');
const gridHorarios = document.getElementById('grid-horarios-cliente');

if (categoriaSelect && servicoSelect) {
    categoriaSelect.addEventListener('change', (e) => {
        const categoriaEscolhida = e.target.value;
        const servicos = JSON.parse(localStorage.getItem('luxe_servicos')) || [];
        const servicosFiltrados = servicos.filter(s => s.categoria === categoriaEscolhida);

        servicoSelect.innerHTML = '<option value="" disabled selected>Escolha o serviço...</option>';
        
        if (servicosFiltrados.length > 0) {
            servicoSelect.disabled = false;
            servicosFiltrados.forEach(s => {
                servicoSelect.innerHTML += `<option value="${s.nome}" data-duracao="${s.duracao}">${s.nome} (${s.duracao})</option>`;
            });
        } else {
            servicoSelect.disabled = true;
        }
        verificarHorarios();
    });

    servicoSelect.addEventListener('change', verificarHorarios);
}

if (dataInput) {
    dataInput.addEventListener('change', verificarHorarios);
}

function verificarHorarios() {
    if (!servicoSelect || !dataInput || !gridHorarios) return;

    const servicoNome = servicoSelect.value;
    const dataEscolhida = dataInput.value;

    if (!servicoNome || !dataEscolhida) {
        gridHorarios.innerHTML = '<p style="font-size: 0.85rem; opacity: 0.7; grid-column: 1/-1;">Selecione o serviço e um dia no calendário acima.</p>';
        return;
    }

    const opcaoSelecionada = servicoSelect.options[servicoSelect.selectedIndex];
    const duracaoStr = opcaoSelecionada.getAttribute('data-duracao');
    const duracaoNovoServico = parseDuracaoParaMinutos(duracaoStr);

    const horariosAdmin = JSON.parse(localStorage.getItem('luxe_horarios')) || [];
    const agendamentos = JSON.parse(localStorage.getItem('luxe_agendamentos')) || [];

    const agendamentosDoDia = agendamentos.filter(ag => ag.data === dataEscolhida);

    gridHorarios.innerHTML = '';
    let temHorarioDisponivel = false;

    horariosAdmin.sort().forEach(horarioCandidato => {
        const candidatoInicio = timeToMinutes(horarioCandidato);
        const candidatoFim = candidatoInicio + duracaoNovoServico;
        
        let conflito = false;

        for (let ag of agendamentosDoDia) {
            const agInicio = timeToMinutes(ag.horario);
            const agFim = agInicio + ag.duracaoMinutos;

            if (candidatoInicio < agFim && candidatoFim > agInicio) {
                conflito = true;
                break;
            }
        }

        if (!conflito) {
            temHorarioDisponivel = true;
            gridHorarios.innerHTML += `
                <label class="time-slot">
                    <input type="radio" name="horario" value="${horarioCandidato}" required>
                    <span>${horarioCandidato}</span>
                </label>
            `;
        }
    });

    if (!temHorarioDisponivel) {
        gridHorarios.innerHTML = '<p style="color: #d9534f; grid-column: 1/-1; font-size: 0.9rem;">Nenhum horário disponível para a duração deste serviço nesta data.</p>';
    }
}

// ==========================================
// 7. Envio do Formulário (Salvar e Exibir Imagem)
// ==========================================
const bookingForm = document.getElementById('booking-form');
const formStatus = document.getElementById('form-status');

if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const servico = servicoSelect.value;
        const data = dataInput.value;
        const horarioInput = document.querySelector('input[name="horario"]:checked');

        if (!data) {
            formStatus.textContent = "Por favor, selecione um dia no calendário.";
            formStatus.style.color = "#d9534f";
            return;
        }

        if (!horarioInput) {
            formStatus.textContent = "Por favor, selecione um horário disponível.";
            formStatus.style.color = "#d9534f";
            return;
        }

        const horario = horarioInput.value;
        const opcaoSelecionada = servicoSelect.options[servicoSelect.selectedIndex];
        const duracaoStr = opcaoSelecionada.getAttribute('data-duracao');
        const duracaoMinutos = parseDuracaoParaMinutos(duracaoStr);

        const btnSubmit = bookingForm.querySelector('button[type="submit"]');
        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = "Processando...";
        btnSubmit.disabled = true;

        try {
            const agendamentos = JSON.parse(localStorage.getItem('luxe_agendamentos')) || [];
            agendamentos.push({
                id: Date.now(),
                nome,
                servico,
                data,
                horario,
                duracaoMinutos
            });
            localStorage.setItem('luxe_agendamentos', JSON.stringify(agendamentos));

            const randomNum = Math.floor(Math.random() * 1000);
            const response = await fetch(`https://picsum.photos/seed/${randomNum}/400/300`);
            const imageBlob = await response.blob();
            const imageObjectURL = URL.createObjectURL(imageBlob);

            formStatus.innerHTML = `Agendamento Confirmado, ${nome}! <strong>${servico}</strong> reservado.<br><br><strong>Uma imagem aleatória para sua inspiração:</strong>`;
            formStatus.style.color = "var(--gold)";
            
            const randomImage = document.createElement('img');
            randomImage.src = imageObjectURL;
            randomImage.alt = "Inspiração";
            randomImage.style.cssText = "width: 100%; border-radius: 4px; margin-top: 20px; border: 1px solid var(--border-color); animation: fadeIn 0.5s ease;";

            const existingImg = formStatus.nextElementSibling;
            if(existingImg && existingImg.tagName === 'IMG') existingImg.remove();
            
            formStatus.parentNode.insertBefore(randomImage, formStatus.nextSibling);

            bookingForm.reset();
            servicoSelect.innerHTML = '<option value="" disabled selected>Selecione uma categoria primeiro...</option>';
            servicoSelect.disabled = true;
            document.querySelectorAll('.date-card').forEach(el => el.classList.remove('active'));
            dataInput.value = '';
            gridHorarios.innerHTML = '<p style="font-size: 0.85rem; opacity: 0.7; grid-column: 1/-1;">Selecione um serviço e um dia no calendário acima.</p>';
            
        } catch (error) {
            console.error("Erro:", error);
            formStatus.textContent = "Erro ao processar o agendamento.";
            formStatus.style.color = "#d9534f";
        } finally {
            btnSubmit.textContent = originalText;
            btnSubmit.disabled = false;
        }
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosDoSite();
    carregarDiasDisponiveis();
});