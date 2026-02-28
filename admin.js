// ==========================================
// 1. Navegação do Painel (Sem botão de tema)
// ==========================================
function switchAdminTab(panelId, btnElement) {
    document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.admin-menu button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    btnElement.classList.add('active');
}

// ==========================================
// 2. FIREBASE LOGIC & GERENCIAMENTO
// ==========================================
// O setTimeout garante que o Firebase (carregado no HTML) esteja pronto
setTimeout(() => {
    const db = window.db;
    const { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc } = window.firestoreTools;

    // --- A. AGENDAMENTOS ---
    async function renderizarAgendamentos() {
        const lista = document.getElementById('lista-agendamentos-admin');
        lista.innerHTML = '<p style="opacity: 0.7;">Carregando agendamentos da nuvem...</p>';
        
        const snap = await getDocs(collection(db, "agendamentos"));
        let agendamentos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Ordena cronologicamente
        agendamentos.sort((a, b) => new Date(`${a.data}T${a.horario}`) - new Date(`${b.data}T${b.horario}`));
        
        lista.innerHTML = agendamentos.length === 0 ? '<p style="opacity: 0.7;">Nenhum agendamento futuro.</p>' : '';
        
        agendamentos.forEach(ag => {
            const [ano, mes, dia] = ag.data.split('-');
            lista.innerHTML += `
                <div class="manage-item agendamento-card">
                    <div>
                        <strong style="font-size: 1.1rem; color: var(--accent);">${dia}/${mes}/${ano} às ${ag.horario}</strong><br>
                        <span style="font-weight: 500;">${ag.nome}</span> - ${ag.servico}<br>
                    </div>
                    <button class="btn-danger" onclick="cancelarAgendamento('${ag.id}')">
                        <i class="fa-solid fa-calendar-xmark"></i> Cancelar
                    </button>
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

    // --- B. SERVIÇOS ---
    async function renderizarServicos() {
        const lista = document.getElementById('lista-servicos-admin');
        const snap = await getDocs(collection(db, "servicos"));
        lista.innerHTML = snap.empty ? '<p style="opacity: 0.7;">Nenhum serviço cadastrado.</p>' : '';
        
        snap.forEach(d => {
            const servico = d.data();
            lista.innerHTML += `
                <div class="manage-item">
                    <div>
                        <strong style="color: var(--accent);">${servico.nome}</strong> (${servico.categoria.toUpperCase()})<br>
                        <span style="font-size: 0.85rem; opacity: 0.8;">Duração: ${servico.duracao} | ${servico.valor}</span>
                    </div>
                    <button class="btn-danger" onclick="deletarServico('${d.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
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
        if(confirm("Excluir este serviço da sua tabela de preços?")) { 
            await deleteDoc(doc(db, "servicos", id)); 
            renderizarServicos(); 
        }
    }

    // --- C. GALERIA (Com Upload ImgBB) ---
    async function renderizarGaleria() {
        const lista = document.getElementById('lista-galeria-admin');
        const snap = await getDocs(collection(db, "galeria"));
        lista.innerHTML = snap.empty ? '<p style="opacity: 0.7;">Nenhuma imagem cadastrada.</p>' : '';
        
        snap.forEach(d => {
            lista.innerHTML += `
                <div class="gallery-admin-card">
                    <img src="${d.data().url}" alt="Arte do Studio">
                    <button class="btn-remove-img" onclick="deletarImagem('${d.id}')" title="Remover Foto">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        });
    }

    document.getElementById('form-galeria').addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('galeria-file').files[0]; 
        if (!file) return;
        
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        btnSubmit.disabled = true; 
        btnSubmit.textContent = "Enviando imagem...";

        try {
            const formData = new FormData(); 
            formData.append("image", file);
            
            // ATENÇÃO: COLOQUE SUA CHAVE DA API DO IMGBB AQUI!
            const apiKey = "SUA_CHAVE_AQUI"; 
            
            const respostaImgbb = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { 
                method: "POST", 
                body: formData 
            });
            const dadosImgbb = await respostaImgbb.json();

            if (dadosImgbb.success) {
                btnSubmit.textContent = "Salvando na nuvem...";
                await addDoc(collection(db, "galeria"), { url: dadosImgbb.data.url });
                btnSubmit.textContent = "Upload Concluído!"; 
                e.target.reset(); 
                renderizarGaleria();
            } else { 
                alert("Erro ao enviar a imagem para o servidor."); 
            }
        } catch (error) { 
            alert("Erro na conexão. Verifique a internet e tente novamente."); 
        } finally { 
            setTimeout(() => { 
                btnSubmit.disabled = false; 
                btnSubmit.textContent = "Fazer Upload e Salvar"; 
            }, 2000); 
        }
    });

    window.deletarImagem = async function(id) {
        if(confirm("Remover esta imagem definitivamente do site?")) { 
            await deleteDoc(doc(db, "galeria", id)); 
            renderizarGaleria(); 
        }
    }

    // --- D. HORÁRIOS DA GRADE BASE ---
    async function renderizarHorarios() {
        const lista = document.getElementById('lista-horarios-admin');
        const snap = await getDocs(collection(db, "horarios"));
        
        let horarios = snap.docs.map(d => ({ id: d.id, val: d.data().horario }));
        horarios.sort((a, b) => a.val.localeCompare(b.val));
        
        lista.innerHTML = horarios.length === 0 ? '<p style="opacity: 0.7;">Nenhum horário base configurado.</p>' : '';
        
        horarios.forEach(hr => {
            lista.innerHTML += `
                <div style="display:flex; align-items:center; gap:10px; padding:10px; border:1px solid var(--glass-border); border-radius:8px; background: var(--glass-highlight);">
                    <strong style="color: var(--accent);">${hr.val}</strong>
                    <button class="btn-danger" style="padding:4px 8px;" onclick="deletarHorario('${hr.id}')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        });
    }

    document.getElementById('form-horario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = e.target.querySelector('button[type="submit"]'); 
        btnSubmit.disabled = true;
        
        await addDoc(collection(db, "horarios"), { 
            horario: document.getElementById('novo-horario').value 
        });
        
        btnSubmit.disabled = false; 
        e.target.reset(); 
        renderizarHorarios();
    });

    window.deletarHorario = async function(id) { 
        await deleteDoc(doc(db, "horarios", id)); 
        renderizarHorarios(); 
    }

    // --- E. DIAS DE FUNCIONAMENTO ---
    async function renderizarDiasTrabalho() {
        const docRef = await getDoc(doc(db, "config", "dias"));
        const diasSalvos = docRef.exists() ? docRef.data().selecionados : [1,2,3,4,5,6];
        
        const container = document.getElementById('dias-trabalho-admin'); 
        container.innerHTML = '';
        
        const diasSemana = [
            {id: 0, nome: 'Dom'}, {id: 1, nome: 'Seg'}, {id: 2, nome: 'Ter'}, 
            {id: 3, nome: 'Qua'}, {id: 4, nome: 'Qui'}, {id: 5, nome: 'Sex'}, {id: 6, nome: 'Sáb'}
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

    window.salvarDiasTrabalho = async function() {
        const selecionados = Array.from(document.querySelectorAll('.check-dia')).filter(c => c.checked).map(c => parseInt(c.value));
        if(selecionados.length === 0) return alert("Atenção: Selecione pelo menos um dia de atendimento!");
        
        await setDoc(doc(db, "config", "dias"), { selecionados }); 
        alert('Dias de funcionamento atualizados com sucesso!');
    }

    // Inicializa todas as listagens quando o Firebase estiver pronto
    renderizarAgendamentos(); 
    renderizarServicos(); 
    renderizarGaleria(); 
    renderizarHorarios(); 
    renderizarDiasTrabalho();

}, 1000);