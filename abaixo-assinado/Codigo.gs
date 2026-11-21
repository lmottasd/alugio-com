/**
 * Abaixo-assinado: redutor de velocidade na Av. Itacimirim (Bioflora Residencial)
 * Google Apps Script que recebe as assinaturas da página
 * wwwroot/abaixo-assinado/index.html e grava na planilha onde o script está.
 *
 * Instalação: veja abaixo-assinado/LEIA-ME.md
 */

const SHEET_NAME = 'Assinaturas';
const HEADERS = [
  'Nº', 'Data/hora', 'Nome completo', 'CPF', 'Telefone', 'E-mail',
  'Endereço', 'Cidade/UF', 'Relação com a via', 'Consentimento LGPD'
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.getRange('D:D').setNumberFormat('@'); // CPF como texto (mantém zeros à esquerda)
    sh.getRange('E:E').setNumberFormat('@');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function count_(sh) {
  return Math.max(0, sh.getLastRow() - 1);
}

function validCPF_(c) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += Number(c[i]) * (t + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

function formatCPF_(c) {
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function clean_(s, max) {
  // Remove caracteres que a planilha interpretaria como fórmula
  return String(s || '').trim().replace(/^[=+\-@]+/, '').slice(0, max);
}

function doGet(e) {
  return json_({ ok: true, count: count_(getSheet_()) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy', message: 'muitas assinaturas ao mesmo tempo' });
  }
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d.website) return json_({ ok: true, count: 0 }); // robô (campo-isca preenchido)

    const cpf = String(d.cpf || '').replace(/\D/g, '');
    const tel = String(d.telefone || '').replace(/\D/g, '');
    const nome = clean_(d.nome, 120);
    const email = clean_(d.email, 150).toLowerCase();

    if (nome.split(/\s+/).length < 2) return json_({ ok: false, error: 'invalid', message: 'nome incompleto' });
    if (!validCPF_(cpf)) return json_({ ok: false, error: 'invalid', message: 'CPF inválido' });
    if (tel.length < 10 || tel.length > 11) return json_({ ok: false, error: 'invalid', message: 'telefone inválido' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json_({ ok: false, error: 'invalid', message: 'e-mail inválido' });
    if (d.consent !== true) return json_({ ok: false, error: 'invalid', message: 'consentimento não marcado' });

    const sh = getSheet_();
    const n = count_(sh);
    const cpfFmt = formatCPF_(cpf);
    if (n > 0) {
      const found = sh.getRange(2, 4, n, 1).createTextFinder(cpfFmt).matchEntireCell(true).findNext();
      if (found) return json_({ ok: false, error: 'duplicate' });
    }

    sh.appendRow([
      n + 1,
      Utilities.formatDate(new Date(), 'America/Bahia', 'dd/MM/yyyy HH:mm:ss'),
      nome,
      cpfFmt,
      tel.length === 11
        ? tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
        : tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3'),
      email,
      clean_(d.endereco, 160),
      clean_(d.cidade, 80),
      clean_(d.vinculo, 60),
      'Sim'
    ]);
    return json_({ ok: true, count: n + 1 });
  } catch (err) {
    return json_({ ok: false, error: 'server', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}
