Coloque aqui os arquivos .glb dos prédios e NPCs.

Nomes esperados (definidos em src/data/locations.json ou vindos do backend):
  - school.glb
  - workshop.glb
  - factory.glb
  - office.glb
  - npc_professor.glb
  - npc_technician.glb
  - npc_developer.glb

Se um arquivo não existir aqui, o site NÃO quebra: o loadModel.js
(em src/utils/loadModel.js) detecta a falha de carregamento e desenha
automaticamente um retângulo (do tamanho do "footprint" definido no JSON)
com o nome do objeto flutuando acima, como placeholder.
