document.addEventListener('DOMContentLoaded', () => {
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
        if (!themeToggle) return;

        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        themeToggle.textContent = theme === 'dark' ? '라이트 모드' : '다크 모드';
        themeToggle.setAttribute('aria-label', `${nextTheme === 'dark' ? '다크' : '라이트'} 모드로 전환`);
    };

    applyTheme(getInitialTheme());

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem(themeStorageKey, nextTheme);
            applyTheme(nextTheme);
        });
    }

    const numbersContainer = document.getElementById('numbers');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const copyStatus = document.getElementById('copy-status');
    const sumStat = document.getElementById('sum-stat');
    const oddEvenStat = document.getElementById('odd-even-stat');
    const rangeStat = document.getElementById('range-stat');
    let currentNumbers = [];

    if (!numbersContainer || !generateBtn) {
        return;
    }

    const generateLottoNumbers = () => {
        const numbers = new Set();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    };

    const getColor = (number) => {
        if (number <= 10) return '#d99000';
        if (number <= 20) return '#2878b8';
        if (number <= 30) return '#c44536';
        if (number <= 40) return '#6f63b6';
        return '#148a57';
    };

    const summarizeRanges = (lottoNumbers) => {
        const ranges = [
            { label: '1~10', count: 0 },
            { label: '11~20', count: 0 },
            { label: '21~30', count: 0 },
            { label: '31~40', count: 0 },
            { label: '41~45', count: 0 }
        ];

        lottoNumbers.forEach((number) => {
            if (number <= 10) ranges[0].count += 1;
            else if (number <= 20) ranges[1].count += 1;
            else if (number <= 30) ranges[2].count += 1;
            else if (number <= 40) ranges[3].count += 1;
            else ranges[4].count += 1;
        });

        return ranges
            .filter((range) => range.count > 0)
            .map((range) => `${range.label} ${range.count}개`)
            .join(', ');
    };

    const updateStats = (lottoNumbers) => {
        const sum = lottoNumbers.reduce((total, number) => total + number, 0);
        const oddCount = lottoNumbers.filter((number) => number % 2 === 1).length;
        const evenCount = lottoNumbers.length - oddCount;

        sumStat.textContent = `${sum}`;
        oddEvenStat.textContent = `홀 ${oddCount} / 짝 ${evenCount}`;
        rangeStat.textContent = summarizeRanges(lottoNumbers);
    };

    const displayNumbers = (lottoNumbers) => {
        numbersContainer.innerHTML = '';
        lottoNumbers.forEach((number, index) => {
            const circle = document.createElement('div');
            circle.className = 'number-circle';
            circle.textContent = number;
            circle.style.backgroundColor = getColor(number);
            circle.style.animationDelay = `${index * 0.05}s`;
            numbersContainer.appendChild(circle);
        });
        updateStats(lottoNumbers);
    };

    const generateAndDisplay = () => {
        currentNumbers = generateLottoNumbers();
        displayNumbers(currentNumbers);
        if (copyStatus) {
            copyStatus.textContent = '';
        }
    };

    generateBtn.addEventListener('click', generateAndDisplay);

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (currentNumbers.length === 0) {
                generateAndDisplay();
            }

            const text = currentNumbers.join(', ');
            try {
                await navigator.clipboard.writeText(text);
                copyStatus.textContent = `복사됨: ${text}`;
            } catch {
                copyStatus.textContent = `복사할 번호: ${text}`;
            }
        });
    }

    generateAndDisplay();
});
