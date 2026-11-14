# Frontend Proagente

Interface simples em HTML, CSS e JavaScript puro. Usa `fetch` para acessar os cadastros da API.

Na pasta principal do projeto, com o PostgreSQL configurado e as migrations executadas:

```powershell
npm.cmd run dev
```

Abra **http://localhost:3000** no navegador (ou a porta configurada no `.env`). O Express entrega a interface e a API no mesmo endereço. Não abra o HTML diretamente nem use Live Server.

Escolha um cadastro no menu. Use **Novo cadastro**, **Editar** ou **Excluir**; a exclusão pede confirmação. A tabela mostra dez registros por página e os erros da API aparecem na tela.

Cadastre cidades, microáreas e famílias, depois agentes, pacientes, médicos, visitas e consultas. Os relacionamentos aparecem por nome e são armazenados pelos IDs no banco. CPF e SUS devem conter somente números.

- `index.html`: estrutura da página.
- `css/style.css`: aparência e adaptação para celular.
- `js/script.js`: campos, formulários e chamadas da API.

Também funciona com `npm.cmd run build` e `npm.cmd start`. Na implantação, mantenha `front` ao lado de `dist`.
