// ==========================================
// 1. Navegação e Tema
// ==========================================
function switchAdminTab(panelId, btnElement) {
    document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.admin-menu button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    btnElement.classList.add('active');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const icon = document.querySelector('#theme-toggle i');
    if (document.body.classList.contains('dark-theme')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
});

// ==========================================
// Atraso para garantir que o Firebase carregou do HTML
// ==========================================
setTimeout(() => {
    const db = window.db;
    const { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc } = window.firestoreTools;

    // ==========================================
    // 2. Gerenciamento de Agendamentos
    // ==========================================
    async function renderizarAgendamentos() {
        const lista = document.getElementById('lista-agendamentos-admin');
        lista.innerHTML = '<p>Carregando agendamentos da nuvem...</p>';

        const snap = await getDocs(collection(db, "agendamentos"));
        let agendamentos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Ordena por data e depois por horário
        agendamentos.sort((a, b) => new Date(`${a.data}T${a.horario}`) - new Date(`${b.data}T${b.horario}`));
        lista.innerHTML = '';

        if (agendamentos.length === 0) {
            lista.innerHTML = '<p>Nenhum agendamento marcado no momento.</p>';
            return;
        }

        agendamentos.forEach(ag => {
            const [ano, mes, dia] = ag.data.split('-');
            const dataFormatada = `${dia}/${mes}/${ano}`;
            
            lista.innerHTML += `
                <div class="manage-item agendamento-card">
                    <div>
                        <strong style="font-size: 1.1rem; color: var(--accent);">${dataFormatada} às ${ag.horario}</strong><br>
                        <span style="font-weight: 500;">${ag.nome}</span> - ${ag.servico}<br>
                    </div>
                    <button class="btn-danger" onclick="cancelarAgendamento('${ag.id}')"><i class="fa-solid fa-calendar-xmark"></i> Cancelar</button>
                </div>
            `;
        });
    }

    window.cancelarAgendamento = async function(id) {
        if(confirm("Deseja cancelar e liberar este horário para outras clientes?")) {
            await deleteDoc(doc(db, "agendamentos", id));
            renderizarAgendamentos();
        }
    }

    // ==========================================
    // 3. Gerenciamento de Serviços
    // ==========================================
    async function renderizarServicos() {
        const lista = document.getElementById('lista-servicos-admin');
        const snap = await getDocs(collection(db, "servicos"));
        lista.innerHTML = '';

        if (snap.empty) {
            lista.innerHTML = '<p>Nenhum serviço cadastrado.</p>';
            return;
        }

        snap.forEach(d => {
            const servico = d.data();
            lista.innerHTML += `
                <div class="manage-item">
                    <div>
                        <strong style="color: var(--accent);">${servico.nome}</strong> (${servico.categoria.toUpperCase()})<br>
                        <span style="font-size: 0.85rem; opacity: 0.8;">Duração: ${servico.duracao} | ${servico.valor}</span>
                    </div>
                    <button class="btn-danger" onclick="deletarServico('${d.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        });
    }

    document.getElementById('form-servico').addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoria = document.getElementById('servico-categoria').value;
        const nome = document.getElementById('servico-nome').value;
        const duracao = document.getElementById('servico-duracao').value;
        const valor = document.getElementById('servico-valor').value;

        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Salvando...";

        await addDoc(collection(db, "servicos"), { categoria, nome, duracao, valor });
        
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Salvar na Nuvem";
        e.target.reset();
        renderizarServicos();
    });

    window.deletarServico = async function(id) {
        if(confirm("Excluir este serviço?")) {
            await deleteDoc(doc(db, "servicos", id));
            renderizarServicos();
        }
    }

    // ==========================================
    // 4. Gerenciamento de Galeria
    // ==========================================
    async function renderizarGaleria() {
        const lista = document.getElementById('lista-galeria-admin');
        const snap = await getDocs(collection(db, "galeria"));
        lista.innerHTML = '';

        if (snap.empty) {
            lista.innerHTML = '<p>Nenhuma imagem cadastrada.</p>';
            return;
        }

        snap.forEach(d => {
            lista.innerHTML += `
                <div class="gallery-admin-card">
                    <img src="${d.data().url}" alt="Galeria">
                    <div class="delete-overlay">
                        <button class="btn-danger" onclick="deletarImagem('${d.id}')"><i class="fa-solid fa-trash"></i> Remover</button>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('form-galeria').addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('galeria-url').value;

        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Salvando...";

        await addDoc(collection(db, "galeria"), { url });

        btnSubmit.disabled = false;
        btnSubmit.textContent = "Salvar na Nuvem";
        e.target.reset();
        renderizarGaleria();
    });

    window.deletarImagem = async function(id) {
        if(confirm("Remover esta imagem da galeria?")) {
            await deleteDoc(doc(db, "galeria", id));
            renderizarGaleria();
        }
    }

    // ==========================================
    // 5. Grade de Horários
    // ==========================================
    async function renderizarHorarios() {
        const lista = document.getElementById('lista-horarios-admin');
        const snap = await getDocs(collection(db, "horarios"));
        
        let horarios = snap.docs.map(d => ({ id: d.id, val: d.data().horario }));
        horarios.sort((a, b) => a.val.localeCompare(b.val));
        
        lista.innerHTML = '';

        if (horarios.length === 0) {
            lista.innerHTML = '<p>Nenhum horário cadastrado na grade base.</p>';
            return;
        }

        horarios.forEach(hr => {
            lista.innerHTML += `
                <div style="display:flex; align-items:center; gap:10px; padding:10px; border:1px solid var(--glass-border); border-radius:8px; background: var(--glass-bg); backdrop-filter: blur(5px);">
                    <strong style="color: var(--accent);">${hr.val}</strong>
                    <button class="btn-danger" style="padding:4px 8px;" onclick="deletarHorario('${hr.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
        });
    }

    document.getElementById('form-horario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const horario = document.getElementById('novo-horario').value;

        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;

        await addDoc(collection(db, "horarios"), { horario });
        
        btnSubmit.disabled = false;
        e.target.reset();
        renderizarHorarios();
    });

    window.deletarHorario = async function(id) {
        await deleteDoc(doc(db, "horarios", id));
        renderizarHorarios();
    }

    // ==========================================
    // 6. Dias de Trabalho
    // ==========================================
    async function renderizarDiasTrabalho() {
        const docRef = await getDoc(doc(db, "config", "dias"));
        const diasSalvos = docRef.exists() ? docRef.data().selecionados : [1,2,3,4,5,6]; // Padrão Seg-Sáb se não existir
        
        const container = document.getElementById('dias-trabalho-admin');
        container.innerHTML = '';
        const diasSemana = [
            { id: 0, nome: 'Domingo' }, { id: 1, nome: 'Segunda' }, { id: 2, nome: 'Terça' }, 
            { id: 3, nome: 'Quarta' }, { id: 4, nome: 'Quinta' }, { id: 5, nome: 'Sexta' }, { id: 6, nome: 'Sábado' }
        ];

        diasSemana.forEach(dia => {
            const isChecked = diasSalvos.includes(dia.id) ? 'checked' : '';
            container.innerHTML += `
                <label class="day-checkbox-label">
                    <input type="checkbox" value="${dia.id}" class="check-dia" ${isChecked}> ${dia.nome}
                </label>
            `;
        });
    }

    window.salvarDiasTrabalho = async function() {
        const checkboxes = document.querySelectorAll('.check-dia');
        const selecionados = Array.from(checkboxes).filter(c => c.checked).map(c => parseInt(c.value));
        
        if(selecionados.length === 0) return alert("Selecione pelo menos um dia de atendimento!");
        
        await setDoc(doc(db, "config", "dias"), { selecionados });
        alert('Dias de atendimento atualizados na nuvem!');
    }

    // ==========================================
    // 7. Inicialização
    // ==========================================
    renderizarAgendamentos();
    renderizarServicos();
    renderizarGaleria();
    renderizarHorarios();
    renderizarDiasTrabalho();

}, 1000);