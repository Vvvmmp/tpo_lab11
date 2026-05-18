const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

let server;
let driver;
const PORT = 3000;
    // Перед всеми тестами запускаем локальный сервер и браузер
    before(async function () {
        // Увеличиваем таймаут до 30 секунд специально для GitHub Actions
        this.timeout(30000); 

        // 1. Запуск сервера
        server = http.createServer((req, res) => {
            if (req.url === '/' || req.url === '/index.html') {
                fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(content);
                });
            }
        });
        await new Promise((resolve) => server.listen(PORT, resolve));

        // 2. Настройка Selenium с дополнительными флагами стабильности
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

    
describe('Тестирование формы авторизации', function () {
    // Перед всеми тестами запускаем локальный сервер и браузер
    before(async function () {
        // 1. Запуск сервера
        server = http.createServer((req, res) => {
            if (req.url === '/' || req.url === '/index.html') {
                fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(content);
                });
            }
        });
        await new Promise((resolve) => server.listen(PORT, resolve));

        // 2. Настройка Selenium (Chrome в headless-режиме для работы в GitHub Actions)
        const options = new chrome.Options();
        options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    });

    // После всех тестов закрываем браузер и сервер
    after(async function () {
        if (driver) await driver.quit();
        if (server) await new Promise((resolve) => server.close(resolve));
    });

    // Перед каждым тестом просто обновляем страницу
    beforeEach(async function () {
        await driver.get(`http://localhost:${PORT}`);
    });

    // ТЕСТ 1: Проверка заголовка страницы
    it('1. Должен отображаться корректный заголовок страницы', async function () {
        const title = await driver.getTitle();
        assert.strictEqual(title, 'Форма входа');
    });

       // ТЕСТ 2: Успешный вход в систему
    it('2. Должен успешно входить при правильных данных', async function () {
        const usernameInput = await driver.findElement(By.id('username'));
        const passwordInput = await driver.findElement(By.id('password'));
        
        await usernameInput.clear();
        await usernameInput.sendKeys('admin');
        await passwordInput.clear();
        await passwordInput.sendKeys('12345');
        
        await driver.findElement(By.id('submitBtn')).click();

        const messageEl = await driver.findElement(By.id('message'));
        // Ждем, пока в элементе появится хоть какой-то текст
        await driver.wait(async () => (await messageEl.getText()) !== '', 3000);
        
        const text = await messageEl.getText();
        const className = await messageEl.getAttribute('class');
        
        assert.strictEqual(text, 'Успешный вход!');
        assert.strictEqual(className, 'success');
    });

    // ТЕСТ 3: Ошибка при неверных данных
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


    // ТЕСТ 4: Валидация обязательных полей (пустая форма)
    it('4. Поля ввода должны иметь атрибут required', async function () {
        const usernameRequired = await driver.findElement(By.id('username')).getAttribute('required');
        const passwordRequired = await driver.findElement(By.id('password')).getAttribute('required');
        
        assert.strictEqual(usernameRequired, 'true');
        assert.strictEqual(passwordRequired, 'true');
    });
});
