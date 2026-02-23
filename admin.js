// ==========================================
// 1. Navegação das Abas e Tema
// ==========================================
function switchAdminTab(panelId, btnElement) {
    document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.admin-menu button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(panelId).classList.add('active');
    btnElement.classList.add('active');
}

const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;
themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const icon = themeToggleBtn.querySelector('i');
    if (body.classList.contains('dark-theme')) {
        icon.classList.remove('fa-moon'); icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun'); icon.classList.add('fa-moon');
    }
});

// ==========================================
// 2. Inicialização do Banco de Dados (LocalStorage)
// ==========================================
if (!localStorage.getItem('luxe_servicos')) {
    localStorage.setItem('luxe_servicos', JSON.stringify([
        { id: 1, categoria: 'cilios', nome: 'Volume Russo Clássico', duracao: '2h 30m', valor: 'R$ 250' }
    ]));
}

if (!localStorage.getItem('luxe_galeria')) {
    localStorage.setItem('luxe_galeria', JSON.stringify([
        { id: 1, url: 'https://images.unsplash.com/photo-1587775953535-71578f795907?auto=format&fit=crop&w=600&q=80' }
    ]));
}

if (!localStorage.getItem('luxe_horarios')) {
    localStorage.setItem('luxe_horarios', JSON.stringify([
        '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'
    ]));
}

if (!localStorage.getItem('luxe_dias_trabalho')) {
    // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
    localStorage.setItem('luxe_dias_trabalho', JSON.stringify([1, 2, 3, 4, 5, 6]));
}

// ==========================================
// 3. Gerenciamento de Agendamentos
// ==========================================
const listaAgendamentosAdmin = document.getElementById('lista-agendamentos-admin');

function renderizarAgendamentos() {
    let agendamentos = JSON.parse(localStorage.getItem('luxe_agendamentos')) || [];
    
    agendamentos.sort((a, b) => {
        const dataA = new Date(`${a.data}T${a.horario}`);
        const dataB = new Date(`${b.data}T${b.horario}`);
        return dataA - dataB;
    });

    listaAgendamentosAdmin.innerHTML = '';

    if (agendamentos.length === 0) {
        listaAgendamentosAdmin.innerHTML = '<p>Nenhum agendamento marcado no momento.</p>';
        return;
    }

    agendamentos.forEach(ag => {
        const [ano, mes, dia] = ag.data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const div = document.createElement('div');
        div.className = 'manage-item agendamento-card';
        div.innerHTML = `
            <div>
                <strong style="font-size: 1.1rem;">${dataFormatada} às ${ag.horario}</strong><br>
                <span style="color: var(--gold); font-weight: 500;">${ag.cliente || ag.nome}</span> - ${ag.servico}<br>
            </div>
            <button class="btn-danger" onclick="cancelarAgendamento(${ag.id})" title="Cancelar / Excluir">
                <i class="fa-solid fa-calendar-xmark"></i> Cancelar
            </button>
        `;
        listaAgendamentosAdmin.appendChild(div);
    });
}

window.cancelarAgendamento = function(id) {
    if(confirm("Tem certeza que deseja cancelar e excluir este agendamento? O horário voltará a ficar disponível no site.")) {
        let agendamentos = JSON.parse(localStorage.getItem('luxe_agendamentos')) || [];
        agendamentos = agendamentos.filter(ag => ag.id !== id);
        localStorage.setItem('luxe_agendamentos', JSON.stringify(agendamentos));
        renderizarAgendamentos();
    }
}

// ==========================================
// 4. Gerenciamento de Serviços
// ==========================================
const formServico = document.getElementById('form-servico');
const listaServicosAdmin = document.getElementById('lista-servicos-admin');

function renderizarServicos() {
    const servicos = JSON.parse(localStorage.getItem('luxe_servicos')) || [];
    listaServicosAdmin.innerHTML = '';

    if (servicos.length === 0) {
        listaServicosAdmin.innerHTML = '<p>Nenhum serviço cadastrado.</p>';
        return;
    }

    servicos.forEach(servico => {
        const div = document.createElement('div');
        div.className = 'manage-item';
        div.innerHTML = `
            <div>
                <strong>${servico.nome}</strong> (${servico.categoria.toUpperCase()})<br>
                <span style="font-size: 0.85rem; opacity: 0.8;">Duração: ${servico.duracao} | ${servico.valor}</span>
            </div>
            <button class="btn-danger" onclick="deletarServico(${servico.id})"><i class="fa-solid fa-trash"></i></button>
        `;
        listaServicosAdmin.appendChild(div);
    });
}

formServico.addEventListener('submit', (e) => {
    e.preventDefault();
    const categoria = document.getElementById('servico-categoria').value;
    const nome = document.getElementById('servico-nome').value;
    const duracao = document.getElementById('servico-duracao').value;
    const valor = document.getElementById('servico-valor').value;

    const servicos = JSON.parse(localStorage.getItem('luxe_servicos')) || [];
    const novoId = servicos.length > 0 ? servicos[servicos.length - 1].id + 1 : 1;

    servicos.push({ id: novoId, categoria, nome, duracao, valor });
    localStorage.setItem('luxe_servicos', JSON.stringify(servicos));
    
    formServico.reset();
    renderizarServicos();
});

window.deletarServico = function(id) {
    if(confirm("Deseja realmente excluir este serviço?")) {
        let servicos = JSON.parse(localStorage.getItem('luxe_servicos')) || [];
        servicos = servicos.filter(s => s.id !== id);
        localStorage.setItem('luxe_servicos', JSON.stringify(servicos));
        renderizarServicos();
    }
}

// ==========================================
// 5. Gerenciamento de Galeria
// ==========================================
const formGaleria = document.getElementById('form-galeria');
const listaGaleriaAdmin = document.getElementById('lista-galeria-admin');

function renderizarGaleria() {
    const imagens = JSON.parse(localStorage.getItem('luxe_galeria')) || [];
    listaGaleriaAdmin.innerHTML = '';

    if (imagens.length === 0) {
        listaGaleriaAdmin.innerHTML = '<p>Nenhuma imagem cadastrada.</p>';
        return;
    }

    imagens.forEach(img => {
        const div = document.createElement('div');
        div.className = 'gallery-admin-card';
        div.innerHTML = `
            <img src="${img.url}" alt="Galeria">
            <div class="delete-overlay">
                <button class="btn-danger" onclick="deletarImagem(${img.id})"><i class="fa-solid fa-trash"></i> Remover</button>
            </div>
        `;
        listaGaleriaAdmin.appendChild(div);
    });
}

formGaleria.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('galeria-url').value;

    const imagens = JSON.parse(localStorage.getItem('luxe_galeria')) || [];
    const novoId = imagens.length > 0 ? imagens[imagens.length - 1].id + 1 : 1;

    imagens.push({ id: novoId, url });
    localStorage.setItem('luxe_galeria', JSON.stringify(imagens));
    
    formGaleria.reset();
    renderizarGaleria();
});

window.deletarImagem = function(id) {
    let imagens = JSON.parse(localStorage.getItem('luxe_galeria')) || [];
    imagens = imagens.filter(img => img.id !== id);
    localStorage.setItem('luxe_galeria', JSON.stringify(imagens));
    renderizarGaleria();
}

// ==========================================
// 6. Gerenciamento da Grade de Horários
// ==========================================
const formHorario = document.getElementById('form-horario');
const listaHorariosAdmin = document.getElementById('lista-horarios-admin');

function renderizarHorarios() {
    let horarios = JSON.parse(localStorage.getItem('luxe_horarios')) || [];
    horarios.sort(); 
    localStorage.setItem('luxe_horarios', JSON.stringify(horarios));

    listaHorariosAdmin.innerHTML = '';

    if (horarios.length === 0) {
        listaHorariosAdmin.innerHTML = '<p>Nenhum horário cadastrado na grade.</p>';
        return;
    }

    horarios.forEach(hr => {
        const div = document.createElement('div');
        div.style.cssText = "display: flex; align-items: center; gap: 10px; padding: 10px 15px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--surface-color);";
        div.innerHTML = `
            <strong>${hr}</strong>
            <button class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="deletarHorario('${hr}')" title="Excluir"><i class="fa-solid fa-xmark"></i></button>
        `;
        listaHorariosAdmin.appendChild(div);
    });
}

formHorario.addEventListener('submit', (e) => {
    e.preventDefault();
    const novoHorario = document.getElementById('novo-horario').value;
    let horarios = JSON.parse(localStorage.getItem('luxe_horarios')) || [];
    
    if (!horarios.includes(novoHorario)) {
        horarios.push(novoHorario);
        localStorage.setItem('luxe_horarios', JSON.stringify(horarios));
    }
    
    formHorario.reset();
    renderizarHorarios();
});

window.deletarHorario = function(hr) {
    let horarios = JSON.parse(localStorage.getItem('luxe_horarios')) || [];
    horarios = horarios.filter(h => h !== hr);
    localStorage.setItem('luxe_horarios', JSON.stringify(horarios));
    renderizarHorarios();
}

// ==========================================
// 7. Gerenciamento de Dias de Trabalho
// ==========================================
function renderizarDiasTrabalho() {
    const diasSalvos = JSON.parse(localStorage.getItem('luxe_dias_trabalho')) || [];
    const container = document.getElementById('dias-trabalho-admin');
    container.innerHTML = '';
    
    const diasSemana = [
        { id: 0, nome: 'Domingo' }, { id: 1, nome: 'Segunda' },
        { id: 2, nome: 'Terça' }, { id: 3, nome: 'Quarta' },
        { id: 4, nome: 'Quinta' }, { id: 5, nome: 'Sexta' }, { id: 6, nome: 'Sábado' }
    ];

    diasSemana.forEach(dia => {
        const isChecked = diasSalvos.includes(dia.id) ? 'checked' : '';
        container.innerHTML += `
            <label class="day-checkbox-label">
                <input type="checkbox" value="${dia.id}" class="check-dia" ${isChecked}>
                ${dia.nome}
            </label>
        `;
    });
}

window.salvarDiasTrabalho = function() {
    const checkboxes = document.querySelectorAll('.check-dia');
    const diasSelecionados = [];
    checkboxes.forEach(chk => {
        if(chk.checked) diasSelecionados.push(parseInt(chk.value));
    });
    
    if(diasSelecionados.length === 0) {
        alert("Você precisa selecionar pelo menos um dia de trabalho na semana!");
        return;
    }

    localStorage.setItem('luxe_dias_trabalho', JSON.stringify(diasSelecionados));
    alert('Dias de funcionamento salvos com sucesso! O site principal foi atualizado.');
}


// ==========================================
// 8. Chamadas Iniciais
// ==========================================
renderizarAgendamentos();
renderizarServicos();
renderizarGaleria();
renderizarHorarios();
renderizarDiasTrabalho();