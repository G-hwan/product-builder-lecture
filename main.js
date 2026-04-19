document.addEventListener('DOMContentLoaded', () => {
    const numbersContainer = document.getElementById('numbers');
    const generateBtn = document.getElementById('generate-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const themeStorageKey = 'lotto-theme';

    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem(themeStorageKey);
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (theme) => {
        document.body.dataset.theme = theme;
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        themeToggle.textContent = theme === 'dark' ? 'White Mode' : 'Dark Mode';
        themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    };

    applyTheme(getInitialTheme());

    const generateLottoNumbers = () => {
        const numbers = new Set();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    };

    const getColor = (number) => {
        if (number <= 10) return '#f39c12'; // Yellow
        if (number <= 20) return '#3498db'; // Blue
        if (number <= 30) return '#e74c3c'; // Red
        if (number <= 40) return '#9b59b6'; // Purple
        return '#2ecc71'; // Green
    };

    const displayNumbers = (lottoNumbers) => {
        numbersContainer.innerHTML = '';
        lottoNumbers.forEach((number, index) => {
            const circle = document.createElement('div');
            circle.className = 'number-circle';
            circle.textContent = number;
            circle.style.backgroundColor = getColor(number);
            circle.style.animationDelay = `${index * 0.1}s`;
            numbersContainer.appendChild(circle);
        });
    };

    generateBtn.addEventListener('click', () => {
        const lottoNumbers = generateLottoNumbers();
        displayNumbers(lottoNumbers);
    });

    themeToggle.addEventListener('click', () => {
        const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(themeStorageKey, nextTheme);
        applyTheme(nextTheme);
    });
});
