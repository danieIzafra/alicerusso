// ==========================================
// 1. Animações de Scroll
// ==========================================
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
});
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ==========================================
// 2. Tabs de Serviços
// ==========================================
function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(el => { el.style.display = "none"; el.classList.remove("active"); });
    document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
    const currentTab = document.getElementById(tabName);
    currentTab.style.display = "block";
    setTimeout(() => currentTab.classList.add("active"), 10);
    evt.currentTarget.classList.add("active");
}

function timeToMinutes(timeStr) { const [h, m] = timeStr.split(':').map(Number); return h * 60 + m; }
function parseDuracao(str) {
    let min = 0;
    const hM = str.match(/(\d+)\s*h/i); const mM = str.match(/(\d+)\s*m/i);
    if (hM) min += parseInt(hM[1]) * 60; if (mM) min += parseInt(mM[1]);
    return min > 0 ? min : 60;
}

// ==========================================
// 3. FIREBASE LOGIC
// ==========================================
setTimeout(async () => {
    const db = window.db;
    const { collection, getDocs, addDoc, doc, getDoc, query, where } = window.firestoreTools;

    async function carregarDadosDoSite() {
        const servicosSnap = await getDocs(collection(db, "servicos"));
        const galeriaSnap = await getDocs(collection(db, "galeria"));
        
        window.servicosGlobais = servicosSnap.docs.map(d => d.data()); 
        
        ['cilios', 'lifting', 'fineline'].forEach(cat => {
            const tbody = document.getElementById(`tbody-${cat}`);
            if(!tbody) return;
            tbody.innerHTML = '';
            const filtrados = window.servicosGlobais.filter(s => s.categoria === cat);
            if(filtrados.length === 0) { tbody.innerHTML = '<tr><td colspan="3">Nenhum serviço disponível.</td></tr>'; return; }
            filtrados.forEach(s => tbody.innerHTML += `<tr><td>${s.nome}</td><td>${s.duracao}</td><td>${s.valor}</td></tr>`);
        });

        const gridGaleria = document.getElementById('gallery-grid-client');
        if(gridGaleria) {
            gridGaleria.innerHTML = '';
            if(!galeriaSnap.empty) {
                galeriaSnap.forEach(d => gridGaleria.innerHTML += `<div class="gallery-item"><img src="${d.data().url}" alt="Arte"></div>`);
            }
        }
    }

    async function carregarDiasDisponiveis() {
        const docRef = await getDoc(doc(db, "config", "dias"));
        const diasTrabalho = docRef.exists() ? docRef.data().selecionados : [1,2,3,4,5,6];
        const container = document.getElementById('date-scroll');
        const inputData = document.getElementById('data');
        if(!container || !inputData) return;
        container.innerHTML = '';
        
        let dataAtual = new Date(); let add = 0; const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        while(add < 15) {
            const diaDaSemana = dataAtual.getDay();
            if(diasTrabalho.includes(diaDaSemana)) {
                const dia = dataAtual.getDate().toString().padStart(2, '0');
                const mes = (dataAtual.getMonth()+1).toString().padStart(2, '0');
                const dataStr = `${dataAtual.getFullYear()}-${mes}-${dia}`;
                const btn = document.createElement('div');
                btn.className = 'date-card';
                btn.innerHTML = `<span class="day-name">${nomesDias[diaDaSemana]}</span><span class="day-num">${dia}</span>`;
                btn.onclick = function() {
                    document.querySelectorAll('.date-card').forEach(e => e.classList.remove('active'));
                    this.classList.add('active'); inputData.value = dataStr; verificarHorariosFirebase();
                };
                container.appendChild(btn); add++;
            }
            dataAtual.setDate(dataAtual.getDate() + 1);
        }
    }

    const catSelect = document.getElementById('categoria-agendamento');
    const servSelect = document.getElementById('servico-agendamento');
    if (catSelect && servSelect) {
        catSelect.addEventListener('change', (e) => {
            servSelect.innerHTML = '<option value="" disabled selected>Escolha o serviço...</option>';
            const filtrados = (window.servicosGlobais || []).filter(s => s.categoria === e.target.value);
            if(filtrados.length > 0) {
                servSelect.disabled = false;
                filtrados.forEach(s => servSelect.innerHTML += `<option value="${s.nome}" data-duracao="${s.duracao}">${s.nome} (${s.duracao})</option>`);
            } else { servSelect.disabled = true; }
            verificarHorariosFirebase();
        });
        servSelect.addEventListener('change', verificarHorariosFirebase);
    }

    async function verificarHorariosFirebase() {
        const gridHorarios = document.getElementById('grid-horarios-cliente');
        const dataEscolhida = document.getElementById('data').value;
        const servicoEscolhido = servSelect.value;
        if(!dataEscolhida || !servicoEscolhido) { gridHorarios.innerHTML = '<p style="grid-column:1/-1; opacity:0.7;">Selecione o serviço e a data.</p>'; return; }
        gridHorarios.innerHTML = '<p style="grid-column:1/-1; color:var(--accent);">Buscando horários...</p>';

        const duracao = parseDuracao(servSelect.options[servSelect.selectedIndex].getAttribute('data-duracao'));
        const horSnap = await getDocs(collection(db, "horarios"));
        const horariosBase = horSnap.docs.map(d => d.data().horario).sort();
        const q = query(collection(db, "agendamentos"), where("data", "==", dataEscolhida));
        const agendamentosDoDia = (await getDocs(q)).docs.map(d => d.data());

        gridHorarios.innerHTML = ''; let temVaga = false;
        horariosBase.forEach(horCandidato => {
            const inicioCand = timeToMinutes(horCandidato); const fimCand = inicioCand + duracao;
            let conflito = false;
            for(let ag of agendamentosDoDia) {
                if(inicioCand < (timeToMinutes(ag.horario) + ag.duracaoMinutos) && fimCand > timeToMinutes(ag.horario)) { conflito = true; break; }
            }
            if(!conflito) {
                temVaga = true;
                gridHorarios.innerHTML += `<label class="time-slot"><input type="radio" name="horario" value="${horCandidato}" required><span>${horCandidato}</span></label>`;
            }
        });
        if(!temVaga) gridHorarios.innerHTML = '<p style="color:#d9534f; grid-column:1/-1;">Sem horários suficientes.</p>';
    }

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('form-status');
            const btnSubmit = e.target.querySelector('button[type="submit"]');
            const nome = document.getElementById('nome').value, data = document.getElementById('data').value, hrInput = document.querySelector('input[name="horario"]:checked');

            if(!data || !hrInput) { status.textContent = "Selecione uma data e horário."; status.style.color = "#d9534f"; return; }
            btnSubmit.textContent = "Processando..."; btnSubmit.disabled = true;

            try {
                const horario = hrInput.value, servico = servSelect.value, duracao = parseDuracao(servSelect.options[servSelect.selectedIndex].getAttribute('data-duracao'));
                await addDoc(collection(db, "agendamentos"), { nome, servico, data, horario, duracaoMinutos: duracao, dataTimestamp: new Date() });
                try { await emailjs.send("service_dl81cjf", "template_k2v79", { nome, servico, horario, data: data.split('-').reverse().join('/') }); } catch (emailError) {}

                status.innerHTML = `Sucesso, ${nome}! <strong>${servico}</strong> reservado com sucesso.`;
                status.style.color = "var(--accent)";
                e.target.reset(); servSelect.disabled = true; document.querySelectorAll('.date-card').forEach(el => el.classList.remove('active'));
                document.getElementById('data').value = ''; document.getElementById('grid-horarios-cliente').innerHTML = '';
            } catch(err) {
                status.textContent = "Erro na nuvem. Tente novamente."; status.style.color = "#d9534f";
            } finally { btnSubmit.textContent = "Confirmar Solicitação"; btnSubmit.disabled = false; }
        });
    }

    carregarDadosDoSite(); carregarDiasDisponiveis();
}, 1000);