import { chromium } from 'playwright';

const EMAIL = 'kayantransit@gmail.com';
const PASSWORD = 'Amina@4048588';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Ouverture de MongoDB Atlas...');
  await page.goto('https://account.mongodb.com/account/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('Saisie email...');
  await page.fill('input[name="username"], input[type="email"]', EMAIL);
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').first().click({ force: true });
  await page.waitForTimeout(2500);

  const pwdField = page.locator('input[name="password"], input[type="password"]');
  if (await pwdField.isVisible().catch(() => false)) {
    console.log('Saisie mot de passe...');
    await pwdField.fill(PASSWORD);
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').first().click({ force: true });
  }

  // Attendre MFA ou dashboard - jusqu'à 90 secondes pour laisser le temps au MFA
  console.log('⏳ Si une vérification MFA apparaît, entre ton code dans le navigateur...');
  try {
    await page.waitForURL(/cloud\.mongodb\.com\/v2/, { timeout: 90000 });
    console.log('✅ Connexion réussie !');
  } catch {
    console.log('Tentative de continuer après MFA...');
    await page.waitForTimeout(5000);
  }

  console.log('Navigation vers Network Access...');
  await page.goto('https://cloud.mongodb.com/v2#/security/network/accessList', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  console.log('Ajout IP whitelist...');
  await page.locator('button:has-text("Add IP Address"), button:has-text("+ Add IP Address")').first().click({ force: true });
  await page.waitForTimeout(2500);

  await page.locator('button:has-text("Allow Access from Anywhere"), button:has-text("ALLOW ACCESS FROM ANYWHERE")').first().click({ force: true });
  await page.waitForTimeout(1000);

  await page.locator('button:has-text("Confirm"), button:has-text("Add Entry"), button:has-text("Save")').first().click({ force: true });
  await page.waitForTimeout(3000);

  console.log('✅ IP 0.0.0.0/0 ajoutée ! MongoDB Atlas accepte maintenant toutes les IPs.');
  await browser.close();
})();
