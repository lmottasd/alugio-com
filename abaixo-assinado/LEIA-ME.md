# Abaixo-assinado on-line: redutor de velocidade na Av. Itacimirim

A página pública fica em `wwwroot/abaixo-assinado/index.html` e, depois do deploy,
responde em `https://<seu-domínio>/abaixo-assinado/`.

As assinaturas vão para uma planilha Google sua, por meio do script `Codigo.gs`.
A página não mostra CPF, telefone nem e-mail de ninguém; só o total de assinaturas.

## Ligar o formulário à planilha (5 minutos, uma vez só)

1. Crie uma planilha nova em https://sheets.new e dê o nome
   "Abaixo-assinado Av. Itacimirim".
2. Na planilha: **Extensões → Apps Script**.
3. Apague o conteúdo do arquivo `Código.gs` que aparece e cole todo o conteúdo de
   `abaixo-assinado/Codigo.gs`. Salve (ícone de disquete).
4. Clique em **Implantar → Nova implantação**.
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Clique em **Implantar**, autorize o acesso com sua conta Google
   (em "App não verificado", clique em *Avançado → Acessar*).
6. Copie a **URL do app da Web** (termina em `/exec`).
7. Abra `wwwroot/abaixo-assinado/index.html`, procure `const SCRIPT_URL = '';`
   e cole a URL entre as aspas:
   ```js
   const SCRIPT_URL = 'https://script.google.com/macros/s/XXXX/exec';
   ```
8. Faça o merge na `main`. O GitHub Actions publica no Azure Static Web Apps.

A aba **Assinaturas** é criada sozinha na primeira assinatura.

Se você alterar o `Codigo.gs` depois, use **Implantar → Gerenciar implantações →
Editar → Nova versão** para manter a mesma URL.

## Dados coletados e por quê

| Campo | Motivo |
|---|---|
| Nome completo | Identifica o signatário (direito de petição, CF art. 5º, XXXIV, "a") |
| CPF | Identificação única; evita assinaturas repetidas (validado pelo dígito verificador) |
| Endereço e Cidade/UF | Mostra o vínculo do signatário com a via e o município |
| Relação com a via | Morador, proprietário, visitante, prestador de serviço ou usuário |
| Telefone e e-mail | Contato e confirmação da assinatura, se a Prefeitura pedir |
| Consentimento LGPD | Autorização para usar os dados só para entregar o pedido (Lei 13.709/2018) |

Um abaixo-assinado dirigido à Prefeitura não exige formato legal rígido. Ele vale como
manifestação coletiva, e o pedido em si pode ser protocolado por qualquer cidadão.
Nome completo e CPF é o que os órgãos públicos costumam aceitar para identificar quem assina.
Título de eleitor só é necessário em projeto de lei de iniciativa popular, que não é o caso.

## Protocolar na Prefeitura

1. Abra a página, preencha data, associação e representante no texto (ou edite antes),
   e imprima o texto (Ctrl+P esconde o formulário automaticamente).
2. Na planilha: **Arquivo → Fazer download → PDF**, aba "Assinaturas"
   (paisagem, ajustar à largura).
3. Junte os dois e protocole na Prefeitura de Camaçari ou na Superintendência de
   Trânsito do município, pedindo número de protocolo.

Sugestão: para entregar uma cópia que circule entre mais pessoas, oculte a coluna de
telefone e e-mail antes de gerar o PDF. CPF pode ser parcialmente mascarado
(`***.456.789-**`) se a Prefeitura aceitar.

## Teste rápido depois de configurar

- Abra `https://<sua-url-/exec>?action=count`: deve responder `{"ok":true,"count":0}`.
- Assine pela página com seus dados e veja a linha aparecer na planilha.
- Tente assinar de novo com o mesmo CPF: a página avisa "Este CPF já assinou".
