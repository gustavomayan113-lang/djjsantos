/* DJ J Santtos - script.js (sem framework, sem banco de dados) */

(function () {
  'use strict';

  const WHATSAPP = '5571999999999'; // troque pelo número real do DJ

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ---------- Canvas de LEDs formando desenhos ----------
  const canvas = document.getElementById('ledsCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const LEDS = 120;
    const leds = [];
    for (let i = 0; i < LEDS; i++) leds.push({ x: 0, y: 0, tx: 0, ty: 0, r: 2 + Math.random() * 2, phase: Math.random() * Math.PI * 2 });

    // Padrões: cada função retorna array de {x,y} normalizados (-1..1)
    function flor(t) {
      const pts = [];
      for (let i = 0; i < LEDS; i++) {
        const a = (i / LEDS) * Math.PI * 2;
        const petala = Math.sin(a * 5) * 0.3 + 0.7;
        const r = petala * (0.3 + 0.1 * Math.sin(t + i));
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      return pts;
    }
    function corredor(t) {
      const pts = [];
      for (let i = 0; i < LEDS; i++) {
        const z = (i / LEDS);
        const ang = z * Math.PI * 8 + t;
        const r = 0.1 + z * 0.9;
        pts.push({ x: Math.cos(ang) * r * 0.6, y: Math.sin(ang) * r * 0.4 - 0.2 + z * 0.4 });
      }
      return pts;
    }
    function coracao(t) {
      const pts = [];
      for (let i = 0; i < LEDS; i++) {
        const a = (i / LEDS) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(a), 3);
        const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
        const s = 0.025 + 0.003 * Math.sin(t + i);
        pts.push({ x: x * s, y: -y * s });
      }
      return pts;
    }
    function estrela(t) {
      const pts = [];
      for (let i = 0; i < LEDS; i++) {
        const a = (i / LEDS) * Math.PI * 2;
        const r = 0.5 + 0.3 * Math.cos(5 * a + t);
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      return pts;
    }
    function onda(t) {
      const pts = [];
      for (let i = 0; i < LEDS; i++) {
        const x = (i / LEDS) * 2 - 1;
        const y = Math.sin(x * Math.PI * 3 + t) * 0.3;
        pts.push({ x, y });
      }
      return pts;
    }
    function anel(t) {
      const pts = [];
      for (let i = 0; i < LEDS; i++) {
        const a = (i / LEDS) * Math.PI * 2 + t * 0.5;
        const r = 0.55 + 0.05 * Math.sin(t * 2 + i);
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      return pts;
    }

    const padroes = [flor, corredor, coracao, estrela, onda, anel];
    let padraoIdx = 0;
    let transicao = 0; // 0..1
    let ultimoTroca = performance.now();
    const DURACAO = 5000;

    function alvo() {
      return padroes[padraoIdx](performance.now() / 1000);
    }

    let ptsAlvo = alvo();
    let ptsAtual = ptsAlvo.map(p => ({ ...p }));

    function tick() {
      const agora = performance.now();
      if (agora - ultimoTroca > DURACAO) {
        padraoIdx = (padraoIdx + 1) % padroes.length;
        ptsAlvo = padroes[padraoIdx](agora / 1000);
        ultimoTroca = agora;
        transicao = 0;
      }
      transicao = Math.min(1, transicao + 0.02);

      const t = agora / 1000;
      const novos = padroes[padraoIdx](t);
      for (let i = 0; i < LEDS; i++) {
        ptsAlvo[i] = novos[i];
      }

      // interpola
      for (let i = 0; i < LEDS; i++) {
        ptsAtual[i].x += (ptsAlvo[i].x - ptsAtual[i].x) * 0.08;
        ptsAtual[i].y += (ptsAlvo[i].y - ptsAtual[i].y) * 0.08;
      }

      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const escala = Math.min(W, H) * 0.45;

      // desenha conexões (corredor/anel)
      ctx.strokeStyle = 'rgba(0,255,136,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < LEDS; i++) {
        const x = cx + ptsAtual[i].x * escala;
        const y = cy + ptsAtual[i].y * escala;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // desenha LEDs
      for (let i = 0; i < LEDS; i++) {
        const x = cx + ptsAtual[i].x * escala;
        const y = cy + ptsAtual[i].y * escala;
        const r = leds[i].r * (1 + 0.3 * Math.sin(t * 2 + leds[i].phase));
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        grad.addColorStop(0, 'rgba(0,255,136,0.9)');
        grad.addColorStop(0.4, 'rgba(0,255,136,0.4)');
        grad.addColorStop(1, 'rgba(0,255,136,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }
    tick();
  }

  // ---------- Luz que segue o mouse ----------
  let luzX = window.innerWidth / 2;
  let luzY = window.innerHeight / 2;
  document.addEventListener('mousemove', (e) => {
    luzX = e.clientX;
    luzY = e.clientY;
  });
  function atualizarLuz() {
    document.documentElement.style.setProperty('--luz-x', luzX + 'px');
    document.documentElement.style.setProperty('--luz-y', luzY + 'px');
    requestAnimationFrame(atualizarLuz);
  }
  atualizarLuz();

  function textoWhatsApp(texto) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  // ---------- Hero: disco toca/para + modo boate ----------
  const palco = $('#palco');
  if (palco) {
    palco.addEventListener('click', () => {
      palco.classList.toggle('tocando');
      document.body.classList.toggle('boate');
      // overlay strobe
      let overlay = document.querySelector('.boate-overlay');
      if (document.body.classList.contains('boate')) {
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'boate-overlay';
          document.body.appendChild(overlay);
        }
      } else {
        if (overlay) overlay.remove();
      }
    });
    palco.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        palco.click();
      }
    });
  }

  // ---------- Galeria: filtros ----------
  const filtros = $$('.filtro');
  const tiles = $$('.tile');
  filtros.forEach((botao) => {
    botao.addEventListener('click', () => {
      const tipo = botao.dataset.t;
      filtros.forEach((b) => b.setAttribute('aria-pressed', b === botao));
      tiles.forEach((tile) => {
        const mostra = tipo === 'todos' || tile.dataset.t === tipo;
        tile.hidden = !mostra;
      });
    });
  });

  // ---------- Galeria: tiles de casamento abrem modal ----------
  $$('.tile[data-t="casamento"]').forEach((tile) => {
    tile.addEventListener('click', () => {
      abrirModal(0);
    });
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirModal(0);
      }
    });
  });

  // ---------- Pacotes: escolher pacote -> WhatsApp ----------
  $$('.pacotes button[data-pacote]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const pacote = botao.dataset.pacote;
      const texto = `Oi, DJ J Santtos! Tenho interesse no pacote ${pacote} para minha festa.`;
      const link = document.createElement('a');
      link.href = textoWhatsApp(texto);
      link.target = '_blank';
      link.rel = 'noopener';
      link.click();
    });
  });

  // ---------- Noite do Vinil: escolher capa ----------
  const capas = $$('.capa');
  const frase = $('#frase');
  const zapVinil = $('#zapVinil');
  capas.forEach((capa) => {
    capa.addEventListener('click', () => {
      capas.forEach((c) => c.classList.remove('aberta'));
      capa.classList.add('aberta');
      if (frase) frase.textContent = capa.dataset.frase;
      if (zapVinil) {
        zapVinil.href = textoWhatsApp(`Oi, DJ J Santtos! Tenho interesse na Noite do Vinil: ${capa.dataset.frase}`);
      }
    });
  });

  // ---------- Depoimentos: carrossel simples ----------
  const proximo = $('#proximo');
  const deps = $$('.dep');
  let depAtual = 0;
  if (proximo && deps.length) {
    function mostraDepoimento(i) {
      deps.forEach((d, idx) => d.classList.toggle('sai', idx !== i));
    }
    proximo.addEventListener('click', () => {
      depAtual = (depAtual + 1) % deps.length;
      mostraDepoimento(depAtual);
    });
  }

  // ---------- Mapa: pontos ----------
  const pontos = $$('.ponto');
  const local = $('#local');
  const listaItens = $$('.mapa-lista li');
  
  function ativarRegiao(indice) {
    pontos.forEach((p, i) => p.classList.toggle('ativo', i === indice));
    listaItens.forEach((li, i) => li.classList.toggle('ativo', i === indice));
    if (local && pontos[indice]) {
      const bairro = pontos[indice].dataset.bairros;
      const nome = pontos[indice].dataset.n;
      local.innerHTML = `<span class="mapa-info-icone" aria-hidden="true">📍</span><span><strong>${nome}</strong><span class="mapa-info-sep"> • </span><small>${bairro}</small></span>`;
    }
  }
  
  pontos.forEach((ponto, i) => {
    ponto.addEventListener('click', () => ativarRegiao(i));
    ponto.addEventListener('mouseenter', () => ativarRegiao(i));
  });
  
  listaItens.forEach((li, i) => {
    li.addEventListener('click', () => ativarRegiao(i));
    li.addEventListener('mouseenter', () => ativarRegiao(i));
  });

  // ---------- WhatsApp: preencher links do rodapé/FAB ----------
  const textoRodape = 'Oi, DJ J Santtos! Vi o seu site e quero fazer um orçamento para a minha festa.';
  $$('#zapRodape, #fab').forEach((el) => {
    el.href = textoWhatsApp(textoRodape);
  });
  if (zapVinil && !zapVinil.href.includes('wa.me')) {
    zapVinil.href = textoWhatsApp(textoRodape);
  }

  // ---------- Modal Álbum de Casamento ----------
  const modalCasamento = $('#modalCasamento');
  const modalVisualizador = $('#modalVisualizador');
  const modalMiniaturas = $('#modalMiniaturas');
  const modalControles = $('#modalControles');
  const modalContador = $('#modalContador');
  const btnFechar = $('.modal-fechar', modalCasamento);
  const btnAnterior = $('#btnAnterior');
  const btnProximo = $('#btnProximo');
  const btnPlayPause = $('#btnPlayPause');
  const volumeSlider = $('#volumeSlider');
  const btnTelaCheia = $('#btnTelaCheia');
  const controlesVideo = $('#controlesVideo');
  const icoPlay = $('.ico-play', btnPlayPause);
  const icoPause = $('.ico-pause', btnPlayPause);

  // Lista de mídias do casamento (fotos e vídeos)
  const midiasCasamento = [
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.29.43.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.29.43.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.30.23.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.30.23.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.48.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.48.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.48 (1).mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.48 (1).mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.49.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.49.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.59.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.59.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.59 (1).mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.42.59 (1).mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.51.06.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.51.06.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.51.07.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.51.07.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.51.09.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.51.09.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.51.09 (1).mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.51.09 (1).mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.52.47.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 21.52.47.mp4' },
    { tipo: 'video', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 22.23.42.mp4', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Video 2026-11-23 at 22.23.42.mp4' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24 (1).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24 (1).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24 (2).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24 (2).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24 (3).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24 (3).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24 (4).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.24 (4).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.25.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.25.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.25 (1).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.25 (1).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.25 (2).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.25 (2).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.25 (3).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.25 (3).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.26.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.26.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.26 (1).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.30.26 (1).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.42.49.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.42.49.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.42.59.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.42.59.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.42.59 (1).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.42.59 (1).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.42.59 (2).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.42.59 (2).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.43.00.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 21.43.00.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 22.02.32.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 22.02.32.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 22.02.32 (1).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-23 at 22.02.32 (1).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.55.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.55.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.55 (1).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.55 (1).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.55 (2).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.55 (2).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (1).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (1).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (2).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (2).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (3).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (3).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (4).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (4).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (5).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.56 (5).jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.57.jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.57.jpeg' },
    { tipo: 'imagem', src: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.57 (1).jpeg', thumb: 'imagens/categorias/fotos e videos casamento/WhatsApp Image 2026-11-24 at 20.52.57 (1).jpeg' },
  ];

  let indiceAtual = 0;
  let videoAtual = null;

  function abrirModal(indice = 0) {
    indiceAtual = indice;
    modalCasamento.hidden = false;
    document.body.style.overflow = 'hidden';
    renderMiniaturas();
    mostrarMidia(indiceAtual);
    btnFechar.focus();
  }

  function fecharModal() {
    modalCasamento.hidden = true;
    document.body.style.overflow = '';
    if (videoAtual) {
      videoAtual.pause();
      videoAtual = null;
    }
    controlesVideo.hidden = true;
  }

  function renderMiniaturas() {
    modalMiniaturas.innerHTML = '';
    midiasCasamento.forEach((midia, i) => {
      const thumb = document.createElement(midia.tipo === 'video' ? 'video' : 'img');
      thumb.src = midia.thumb;
      thumb.alt = `Miniatura ${i + 1}`;
      thumb.dataset.index = i;
      if (midia.tipo === 'video') {
        thumb.muted = true;
        thumb.preload = 'metadata';
      }
      thumb.addEventListener('click', () => {
        indiceAtual = i;
        mostrarMidia(indiceAtual);
        atualizarMiniaturas();
      });
      modalMiniaturas.appendChild(thumb);
    });
    atualizarMiniaturas();
  }

  function atualizarMiniaturas() {
    $$('img, video', modalMiniaturas).forEach((el, i) => {
      el.classList.toggle('ativo', i === indiceAtual);
    });
  }

  function mostrarMidia(indice) {
    const midia = midiasCasamento[indice];
    modalVisualizador.innerHTML = '';
    controlesVideo.hidden = true;

    if (videoAtual) {
      videoAtual.pause();
      videoAtual.removeEventListener('ended', proximoMidia);
      videoAtual = null;
    }
    icoPlay.hidden = false;
    icoPause.hidden = true;

    if (midia.tipo === 'imagem') {
      const img = document.createElement('img');
      img.src = midia.src;
      img.alt = `Foto de casamento ${indice + 1}`;
      img.loading = 'lazy';
      modalVisualizador.appendChild(img);
    } else if (midia.tipo === 'video') {
      const video = document.createElement('video');
      video.src = midia.src;
      video.controls = false;
      video.preload = 'metadata';
      video.playsInline = true;
      modalVisualizador.appendChild(video);
      videoAtual = video;
      controlesVideo.hidden = false;
      volumeSlider.value = 1;
      video.volume = 1;

      video.addEventListener('click', togglePlayPause);
      video.addEventListener('ended', proximoMidia);
      btnPlayPause.onclick = togglePlayPause;
      volumeSlider.oninput = () => { video.volume = volumeSlider.value; };
      btnTelaCheia.onclick = () => {
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.msRequestFullscreen) video.msRequestFullscreen();
      };
    }

    modalContador.textContent = `${indice + 1} de ${midiasCasamento.length}`;
    atualizarMiniaturas();
    atualizarBotoesNavegacao();
  }

  function togglePlayPause() {
    if (!videoAtual) return;
    if (videoAtual.paused) {
      videoAtual.play();
      icoPlay.hidden = true;
      icoPause.hidden = false;
    } else {
      videoAtual.pause();
      icoPlay.hidden = false;
      icoPause.hidden = true;
    }
  }

  function proximoMidia() {
    if (indiceAtual < midiasCasamento.length - 1) {
      indiceAtual++;
      mostrarMidia(indiceAtual);
    }
  }

  function anteriorMidia() {
    if (indiceAtual > 0) {
      indiceAtual--;
      mostrarMidia(indiceAtual);
    }
  }

  function atualizarBotoesNavegacao() {
    btnAnterior.disabled = indiceAtual === 0;
    btnProximo.disabled = indiceAtual === midiasCasamento.length - 1;
    btnAnterior.style.opacity = indiceAtual === 0 ? '0.4' : '1';
    btnProximo.style.opacity = indiceAtual === midiasCasamento.length - 1 ? '0.4' : '1';
  }

  // Event listeners do modal
  btnFechar.addEventListener('click', fecharModal);
  modalCasamento.querySelector('.modal-overlay').addEventListener('click', fecharModal);
  btnAnterior.addEventListener('click', anteriorMidia);
  btnProximo.addEventListener('click', proximoMidia);

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (modalCasamento.hidden) return;
    if (e.key === 'Escape') fecharModal();
    else if (e.key === 'ArrowLeft') anteriorMidia();
    else if (e.key === 'ArrowRight') proximoMidia();
    else if (e.key === ' ' && videoAtual) {
      e.preventDefault();
      togglePlayPause();
    }
  });

  // ---------- Galeria: filtro Casamento abre modal ----------
  const filtroCasamento = $('[data-t="casamento"]', document.querySelector('.filtros'));
  if (filtroCasamento) {
    filtroCasamento.addEventListener('click', (e) => {
      e.preventDefault();
      // Não filtrar, abrir modal
      abrirModal(0);
      // Manter o botão "Todas" pressionado
      $$('.filtro').forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === 'todos'));
      tiles.forEach((tile) => { tile.hidden = false; });
    });
  }

  // ---------- Pacotes: escolher pacote -> WhatsApp ----------
  const passoEl = $('#passo');
  const barra = $('#barra');
  if (passoEl) {
    let etapa = 1;
    const dados = { evento: '', data: '', pessoas: '', pacote: '', nome: '', telefone: '' };

    const eventos = [
      { id: 'casamento', label: 'Casamento' },
      { id: '15anos', label: '15 anos' },
      { id: 'aniversario', label: 'Aniversário' },
      { id: 'corporativo', label: 'Evento corporativo' },
      { id: 'outro', label: 'Outro' }
    ];

    const pacotes = [
      { id: 'som', label: 'Som', preco: 'A partir de R$ 800' },
      { id: 'luz', label: 'Iluminação', preco: 'A partir de R$ 600' },
      { id: 'completo', label: 'Completo (Som + Luz)', preco: 'A partir de R$ 1.400' }
    ];

    function render() {
      barra.style.width = ((etapa - 1) / 3) * 100 + '%';

      if (etapa === 1) {
        passoEl.innerHTML = `
          <h3>Qual o tipo do evento?</h3>
          <div class="chips" role="radiogroup" aria-label="Tipo de evento">
            ${eventos.map(e => `<button type="button" class="chip ${dados.evento === e.id ? 'on' : ''}" data-e="${e.id}" role="radio" aria-checked="${dados.evento === e.id}">${e.label}</button>`).join('')}
          </div>
          <div class="botoes" style="margin-top:1.2rem">
            <button type="button" class="btn principal" id="btnProx1" ${!dados.evento ? 'disabled' : ''}>Próximo</button>
          </div>
        `;
        $$('.chip', passoEl).forEach((chip) => {
          chip.addEventListener('click', () => {
            dados.evento = chip.dataset.e;
            $$('.chip', passoEl).forEach((c) => {
              c.classList.toggle('on', c === chip);
              c.setAttribute('aria-checked', c === chip);
            });
            $('#btnProx1').disabled = !dados.evento;
          });
        });
        $('#btnProx1').addEventListener('click', () => { etapa = 2; render(); });
      } else if (etapa === 2) {
        passoEl.innerHTML = `
          <h3>Quando é a festa?</h3>
          <label for="dataEvento">Data</label>
          <input type="date" id="dataEvento" value="${dados.data}">
          <label for="pessoas">Quantas pessoas?</label>
          <input type="number" id="pessoas" min="1" value="${dados.pessoas}">
          <div class="botoes" style="margin-top:1.2rem;display:flex;justify-content:space-between">
            <button type="button" class="btn" id="btnVolt1">Voltar</button>
            <button type="button" class="btn principal" id="btnProx2" ${!(dados.data && dados.pessoas) ? 'disabled' : ''}>Próximo</button>
          </div>
        `;
        const inpData = $('#dataEvento', passoEl);
        const inpPessoas = $('#pessoas', passoEl);
        inpData.addEventListener('input', () => { dados.data = inpData.value; $('#btnProx2').disabled = !(dados.data && dados.pessoas); });
        inpPessoas.addEventListener('input', () => { dados.pessoas = inpPessoas.value; $('#btnProx2').disabled = !(dados.data && dados.pessoas); });
        $('#btnVolt1').addEventListener('click', () => { etapa = 1; render(); });
        $('#btnProx2').addEventListener('click', () => { etapa = 3; render(); });
      } else if (etapa === 3) {
        passoEl.innerHTML = `
          <h3>Escolha o pacote</h3>
          <div class="chips" role="radiogroup" aria-label="Pacote">
            ${pacotes.map(p => `<button type="button" class="chip ${dados.pacote === p.id ? 'on' : ''}" data-p="${p.id}" role="radio" aria-checked="${dados.pacote === p.id}">${p.label} <span style="opacity:.8;font-size:.85rem">(${p.preco})</span></button>`).join('')}
          </div>
          <label for="nomeContato">Seu nome</label>
          <input type="text" id="nomeContato" placeholder="Seu nome" value="${dados.nome}">
          <label for="telContato">WhatsApp</label>
          <input type="tel" id="telContato" placeholder="(71) 9xxxx-xxxx" value="${dados.telefone}">
          <div class="botoes" style="margin-top:1.2rem;display:flex;justify-content:space-between">
            <button type="button" class="btn" id="btnVolt2">Voltar</button>
            <button type="button" class="btn principal" id="btnFinal" ${!(dados.pacote && dados.nome && dados.telefone) ? 'disabled' : ''}>Gerar orçamento</button>
          </div>
        `;
        $$('.chip', passoEl).forEach((chip) => {
          chip.addEventListener('click', () => {
            dados.pacote = chip.dataset.p;
            $$('.chip', passoEl).forEach((c) => {
              c.classList.toggle('on', c === chip);
              c.setAttribute('aria-checked', c === chip);
            });
            atualizarBtnFinal();
          });
        });
        const inpNome = $('#nomeContato', passoEl);
        const inpTel = $('#telContato', passoEl);
        inpNome.addEventListener('input', () => { dados.nome = inpNome.value; atualizarBtnFinal(); });
        inpTel.addEventListener('input', () => { dados.telefone = inpTel.value; atualizarBtnFinal(); });
        $('#btnVolt2').addEventListener('click', () => { etapa = 2; render(); });
        $('#btnFinal').addEventListener('click', () => { etapa = 4; render(); });
      } else if (etapa === 4) {
        const pacoteSel = pacotes.find(p => p.id === dados.pacote);
        const texto = `Oi, DJ J Santtos! Quero um orçamento:\nEvento: ${dados.evento}\nData: ${dados.data}\nPessoas: ${dados.pessoas}\nPacote: ${pacoteSel.label} (${pacoteSel.preco})\nNome: ${dados.nome}\nWhatsApp: ${dados.telefone}`;
        passoEl.innerHTML = `
          <h3>Pronto! 🎉</h3>
          <p class="valor">Orçamento gerado</p>
          <ul class="resumo">
            <li><strong>Evento:</strong> ${dados.evento}</li>
            <li><strong>Data:</strong> ${dados.data}</li>
            <li><strong>Pessoas:</strong> ${dados.pessoas}</li>
            <li><strong>Pacote:</strong> ${pacoteSel.label} · ${pacoteSel.preco}</li>
            <li><strong>Nome:</strong> ${dados.nome}</li>
            <li><strong>WhatsApp:</strong> ${dados.telefone}</li>
          </ul>
          <div class="botoes" style="margin-top:1.2rem">
            <a class="btn principal" href="${textoWhatsApp(texto)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>
            <button type="button" class="btn" id="btnNovo">Fazer outro</button>
          </div>
        `;
        $('#btnNovo').addEventListener('click', () => {
          etapa = 1;
          dados.evento = ''; dados.data = ''; dados.pessoas = '';
          dados.pacote = ''; dados.nome = ''; dados.telefone = '';
          render();
        });
      }
    }

    function atualizarBtnFinal() {
      const btn = $('#btnFinal');
      if (btn) btn.disabled = !(dados.pacote && dados.nome && dados.telefone);
    }

    render();
  }
})();
