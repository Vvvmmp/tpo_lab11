const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

let server;
let driver;
let testUrl;

describe('Тестирование формы авторизации', function () {
    before(async function () {
        this.timeout(30000); 

        server = http.createServer((req, res) => {
            if (req.url === '/' || req.url === '/index.html') {
                fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(content);
                });
            }
        });

        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        
        testUrl = `http://127.0.0.1:${address.port}`;
        console.log(`Тестовый сервер запущен на: ${testUrl}`);

        const options = new chrome.Options();
        options.addArguments(
            '--headless', 
            '--no-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        );
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    });

    after(async function () {
        if (driver) await driver.quit();
        if (server) await new Promise((resolve) => server.close(resolve));
    });

    beforeEach(async function () {
        await driver.get(testUrl);
    });

    it('1. Должен отображаться корректный заголовок страницы', async function () {
        const title = await driver.getTitle();
        assert.strictEqual(title, 'Форма входа');
    });

    it('2. Должен успешно входить при правильных данных', async function () {
        const usernameInput = await driver.findElement(By.id('username'));
        const passwordInput = await driver.findElement(By.id('password'));
        
        await usernameInput.clear();
        await usernameInput.sendKeys('admin');
        await passwordInput.clear();
        await passwordInput.sendKeys('12345');
        
        await driver.findElement(By.id('submitBtn')).click();

        const messageEl = await driver.findElement(By.id('message'));
        await driver.wait(async () => (await messageEl.getText()) !== '', 3000);
        
        const text = await messageEl.getText();
        const className = await messageEl.getAttribute('class');
        
        assert.strictEqual(text, 'Успешный вход!');
        assert.strictEqual(className, 'success');
    });

    it('3. Должен выводить ошибку при неверном пароле', async function () {
        const usernameInput = await driver.findElement(By.id('username'));
        const passwordInput = await driver.findElement(By.id('password'));
        
        await usernameInput.clear();
        await usernameInput.sendKeys('admin');
        await passwordInput.clear();
        await passwordInput.sendKeys('wrong_password');
        
        await driver.findElement(By.id('submitBtn')).click();

        const messageEl = await driver.findElement(By.id('message'));
        // Ждем, пока в элементе появится хоть какой-то текст
        await driver.wait(async () => (await messageEl.getText()) !== '', 3000);
        
        const text = await messageEl.getText();
        const className = await messageEl.getAttribute('class');
        
        assert.strictEqual(text, 'Неверное имя или пароль');
        assert.strictEqual(className, 'error');
    });


    it('4. Поля ввода должны иметь атрибут required', async function () {
        const usernameRequired = await driver.findElement(By.id('username')).getAttribute('required');
        const passwordRequired = await driver.findElement(By.id('password')).getAttribute('required');
        
        assert.strictEqual(usernameRequired, 'true');
        assert.strictEqual(passwordRequired, 'true');
    });
});
