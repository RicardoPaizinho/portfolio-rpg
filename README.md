# Cidade do Ricardo — Portfólio RPG Interativo

Portfólio jogável estilo Zelda/Pokémon: cada "casa" no mapa é um local onde o
Ricardo trabalhou ou estudou; entrar perto de um NPC mostra um diálogo sobre
o que ele fazia lá (reparo de hardware, desenvolvimento de sistemas, etc).

## Estrutura

```
portfolio-rpg/
├── frontend/                  # Vue 3 + Three.js (Vite)
│   ├── src/
│   │   ├── components/GameCanvas.vue   # cena 3D + UI
│   │   ├── utils/loadModel.js          # carrega .glb OU desenha placeholder
│   │   └── data/locations.json         # fallback local (mesmo shape da API)
│   └── public/models/                  # coloque os .glb aqui
└── backend/                   # Java 25 + Spring Boot
    └── src/main/java/com/ricardo/portfolio/
        ├── PortfolioApplication.java
        └── LocationController.java     # GET /api/locations
```

## Como rodar

### Backend (Java 25 + Maven)
```bash
cd backend
mvn spring-boot:run
# sobe em http://localhost:8080
```

### Frontend (Node 18+)
```bash
cd frontend
npm install     # instala vue, three, vite (ver package.json)
npm run dev
# abre em http://localhost:5173
```

Em dev, o Vite faz proxy de `/api/*` para `http://localhost:8080` (ver
`vite.config.js`). Se o backend estiver fora do ar, o frontend cai
automaticamente para o `locations.json` local — o site nunca quebra.

## Modelos 3D

Coloque arquivos `.glb` em `frontend/public/models/` com os nomes referenciados
em `locations.json` (ex: `workshop.glb`, `npc_technician.glb`). Se um arquivo
não existir, `loadModel.js` desenha automaticamente um retângulo do tamanho
do `footprint` definido no JSON, com o nome do local/NPC flutuando acima —
então o mapa fica navegável mesmo antes de você ter os modelos prontos.

## Próximos passos sugeridos
- Adicionar colisão simples entre o jogador e as casas
- Guestbook (recrutadores deixam recado) via novo endpoint Java + tabela no banco
- Trocar os placeholders por modelos low-poly reais (Blender → .glb)
