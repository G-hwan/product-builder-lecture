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

    const numberGrid = document.getElementById('number-grid');
    const combinationsContainer = document.getElementById('numbers');
    const generateBtn = document.getElementById('generate-btn');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const copyBtn = document.getElementById('copy-btn');
    const copyStatus = document.getElementById('copy-status');
    const combinationCountInput = document.getElementById('combination-count');
    const quickModeSelect = document.getElementById('quick-mode');
    const fixedSummary = document.getElementById('fixed-summary');
    const excludedSummary = document.getElementById('excluded-summary');
    const comboCountStat = document.getElementById('combo-count-stat');
    const sumStat = document.getElementById('sum-stat');
    const oddEvenStat = document.getElementById('odd-even-stat');
    const rangeStat = document.getElementById('range-stat');

    const latestWinning = document.getElementById('latest-winning');
    const recentWinningList = document.getElementById('recent-winning-list');
    const reloadWinningBtn = document.getElementById('reload-winning-btn');
    const drawInput = document.getElementById('draw-input');
    const drawSearchBtn = document.getElementById('draw-search-btn');
    const drawResult = document.getElementById('draw-result');

    const fixedNumbers = new Set();
    const excludedNumbers = new Set();
    let currentCombinations = [];

    const allNumbers = Array.from({ length: 45 }, (_, index) => index + 1);
    const fallbackDraws = [
        { drawNo: 1223, date: '2026-05-09', numbers: [16, 18, 20, 32, 33, 39], bonus: 26 },
        { drawNo: 1222, date: '2026-05-02', numbers: [4, 11, 17, 22, 32, 41], bonus: 34 },
        { drawNo: 1221, date: '2026-04-25', numbers: [6, 13, 18, 28, 30, 36], bonus: 9 },
        { drawNo: 1220, date: '2026-04-18', numbers: [2, 22, 25, 28, 34, 43], bonus: 16 },
        { drawNo: 1219, date: '2026-04-11', numbers: [1, 2, 15, 28, 39, 45], bonus: 31 },
        { drawNo: 1218, date: '2026-04-04', numbers: [3, 28, 31, 32, 42, 45], bonus: 25 },
        { drawNo: 1217, date: '2026-03-28', numbers: [8, 10, 15, 20, 29, 31], bonus: 41 }
    ];

    const getColor = (number) => {
        if (number <= 10) return '#d99000';
        if (number <= 20) return '#2878b8';
        if (number <= 30) return '#c44536';
        if (number <= 40) return '#6f63b6';
        return '#148a57';
    };

    const getLatestDrawEstimate = () => {
        const firstDrawDate = new Date('2002-12-07T12:00:00+09:00');
        const now = new Date();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        return Math.max(1, Math.floor((now.getTime() - firstDrawDate.getTime()) / weekMs) + 1);
    };

    const fetchDraw = async (drawNo) => {
        const response = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`);
        if (!response.ok) {
            throw new Error('당첨번호 데이터를 불러오지 못했습니다.');
        }

        const data = await response.json();
        if (data.returnValue !== 'success') {
            throw new Error('아직 발표되지 않은 회차입니다.');
        }

        return {
            drawNo: data.drwNo,
            date: data.drwNoDate,
            numbers: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
            bonus: data.bnusNo
        };
    };

    const findLatestDraw = async () => {
        let drawNo = getLatestDrawEstimate() + 2;
        for (let attempt = 0; attempt < 12; attempt += 1) {
            try {
                return await fetchDraw(drawNo);
            } catch {
                drawNo -= 1;
            }
        }
        throw new Error('최근 회차를 찾지 못했습니다.');
    };

    const createBall = (number, extraClass = '') => {
        const ball = document.createElement('span');
        ball.className = `number-circle ${extraClass}`.trim();
        ball.textContent = number;
        ball.style.backgroundColor = getColor(number);
        return ball;
    };

    const renderWinningCard = (draw) => {
        const card = document.createElement('article');
        card.className = 'winning-card';

        const title = document.createElement('div');
        title.className = 'winning-title';
        title.innerHTML = `<strong>${draw.drawNo}회</strong><span>${draw.date}</span>`;

        const balls = document.createElement('div');
        balls.className = 'winning-balls';
        draw.numbers.forEach((number) => balls.appendChild(createBall(number)));

        const plus = document.createElement('span');
        plus.className = 'bonus-plus';
        plus.textContent = '+';
        balls.appendChild(plus);
        balls.appendChild(createBall(draw.bonus, 'bonus-ball'));

        card.append(title, balls);
        return card;
    };

    const loadWinningNumbers = async () => {
        if (!latestWinning || !recentWinningList) return;

        latestWinning.textContent = '당첨번호를 불러오는 중입니다.';
        recentWinningList.textContent = '최근 당첨번호를 불러오는 중입니다.';

        try {
            const latestDraw = await findLatestDraw();
            latestWinning.innerHTML = '';
            latestWinning.appendChild(renderWinningCard(latestDraw));

            const recentDraws = await Promise.all(
                Array.from({ length: 7 }, (_, index) => fetchDraw(latestDraw.drawNo - index))
            );

            recentWinningList.innerHTML = '';
            recentDraws.forEach((draw) => recentWinningList.appendChild(renderWinningCard(draw)));

            if (drawInput && !drawInput.value) {
                drawInput.value = latestDraw.drawNo;
            }
        } catch (error) {
            latestWinning.innerHTML = '';
            latestWinning.appendChild(renderWinningCard(fallbackDraws[0]));

            recentWinningList.innerHTML = '';
            fallbackDraws.forEach((draw) => recentWinningList.appendChild(renderWinningCard(draw)));

            if (drawInput && !drawInput.value) {
                drawInput.value = fallbackDraws[0].drawNo;
            }

            const notice = document.createElement('p');
            notice.className = 'fine-print';
            notice.textContent = '실시간 조회가 차단되어 내장된 최근 7회 데이터를 표시하고 있습니다.';
            recentWinningList.appendChild(notice);
        }
    };

    const lookupDraw = async () => {
        if (!drawInput || !drawResult) return;
        const drawNo = Number(drawInput.value);

        if (!Number.isInteger(drawNo) || drawNo < 1) {
            drawResult.textContent = '조회할 회차 번호를 입력해주세요.';
            return;
        }

        drawResult.textContent = '회차를 조회하는 중입니다.';
        try {
            const draw = await fetchDraw(drawNo);
            drawResult.innerHTML = '';
            drawResult.appendChild(renderWinningCard(draw));
        } catch (error) {
            const fallbackDraw = fallbackDraws.find((draw) => draw.drawNo === drawNo);
            if (fallbackDraw) {
                drawResult.innerHTML = '';
                drawResult.appendChild(renderWinningCard(fallbackDraw));
                return;
            }
            drawResult.textContent = `${error.message} 최근 7회 외의 회차는 잠시 후 다시 시도해주세요.`;
        }
    };

    const updateSelectionSummary = () => {
        const fixed = Array.from(fixedNumbers).sort((a, b) => a - b);
        const excluded = Array.from(excludedNumbers).sort((a, b) => a - b);
        fixedSummary.textContent = fixed.length ? fixed.join(', ') : '없음';
        excludedSummary.textContent = excluded.length ? excluded.join(', ') : '없음';
    };

    const renderNumberGrid = () => {
        if (!numberGrid) return;
        numberGrid.innerHTML = '';

        allNumbers.forEach((number) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'pick-number';
            button.textContent = number;
            button.dataset.number = number;

            if (fixedNumbers.has(number)) button.classList.add('fixed');
            if (excludedNumbers.has(number)) button.classList.add('excluded');

            button.addEventListener('click', () => {
                if (!fixedNumbers.has(number) && !excludedNumbers.has(number)) {
                    if (fixedNumbers.size >= 6) {
                        copyStatus.textContent = '고정 번호는 최대 6개까지 선택할 수 있습니다.';
                        return;
                    }
                    fixedNumbers.add(number);
                } else if (fixedNumbers.has(number)) {
                    fixedNumbers.delete(number);
                    excludedNumbers.add(number);
                } else {
                    excludedNumbers.delete(number);
                }

                copyStatus.textContent = '';
                renderNumberGrid();
                updateSelectionSummary();
            });

            numberGrid.appendChild(button);
        });
    };

    const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

    const getCandidatePool = () => {
        const mode = quickModeSelect?.value || 'balanced';
        const available = allNumbers.filter((number) => !fixedNumbers.has(number) && !excludedNumbers.has(number));

        if (mode === 'low') return available.filter((number) => number <= 30);
        if (mode === 'high') return available.filter((number) => number >= 16);
        if (mode === 'odd') return available.concat(available.filter((number) => number % 2 === 1));
        if (mode === 'even') return available.concat(available.filter((number) => number % 2 === 0));
        return available;
    };

    const generateCombination = () => {
        const selected = Array.from(fixedNumbers);
        const pool = getCandidatePool();
        let guard = 0;

        while (selected.length < 6 && guard < 400) {
            const candidate = randomItem(pool);
            if (candidate && !selected.includes(candidate) && !excludedNumbers.has(candidate)) {
                selected.push(candidate);
            }
            guard += 1;
        }

        if (selected.length < 6) {
            const fallbackPool = allNumbers.filter((number) => !selected.includes(number) && !excludedNumbers.has(number));
            while (selected.length < 6 && fallbackPool.length) {
                const index = Math.floor(Math.random() * fallbackPool.length);
                selected.push(fallbackPool.splice(index, 1)[0]);
            }
        }

        if (selected.length < 6) {
            throw new Error('선택 조건이 너무 많아 조합을 만들 수 없습니다.');
        }

        return selected.sort((a, b) => a - b);
    };

    const summarizeRanges = (combinations) => {
        const flat = combinations.flat();
        const counts = [
            { label: '1~10', count: flat.filter((number) => number <= 10).length },
            { label: '11~20', count: flat.filter((number) => number >= 11 && number <= 20).length },
            { label: '21~30', count: flat.filter((number) => number >= 21 && number <= 30).length },
            { label: '31~40', count: flat.filter((number) => number >= 31 && number <= 40).length },
            { label: '41~45', count: flat.filter((number) => number >= 41).length }
        ];

        return counts
            .filter((range) => range.count > 0)
            .map((range) => `${range.label} ${range.count}개`)
            .join(', ');
    };

    const updateStats = (combinations) => {
        if (!combinations.length) return;

        const sums = combinations.map((combo) => combo.reduce((total, number) => total + number, 0));
        const oddCounts = combinations.map((combo) => combo.filter((number) => number % 2 === 1).length);
        const averageSum = Math.round(sums.reduce((total, sum) => total + sum, 0) / sums.length);
        const averageOdd = (oddCounts.reduce((total, count) => total + count, 0) / oddCounts.length).toFixed(1);

        comboCountStat.textContent = `${combinations.length}개`;
        sumStat.textContent = `${averageSum}`;
        oddEvenStat.textContent = `홀 ${averageOdd} / 짝 ${(6 - Number(averageOdd)).toFixed(1)}`;
        rangeStat.textContent = summarizeRanges(combinations);
    };

    const displayCombinations = (combinations) => {
        combinationsContainer.innerHTML = '';

        combinations.forEach((combination, index) => {
            const row = document.createElement('article');
            row.className = 'combination-row';

            const label = document.createElement('strong');
            label.textContent = `${index + 1}조합`;

            const balls = document.createElement('div');
            balls.className = 'combination-balls';
            combination.forEach((number) => balls.appendChild(createBall(number)));

            row.append(label, balls);
            combinationsContainer.appendChild(row);
        });

        updateStats(combinations);
    };

    const generateCombinations = () => {
        if (!generateBtn || !combinationsContainer) return;

        const requestedCount = Math.min(50, Math.max(1, Number(combinationCountInput?.value || 1)));
        combinationCountInput.value = requestedCount;
        currentCombinations = [];

        try {
            for (let index = 0; index < requestedCount; index += 1) {
                currentCombinations.push(generateCombination());
            }
            displayCombinations(currentCombinations);
            copyStatus.textContent = '';
        } catch (error) {
            copyStatus.textContent = error.message;
        }
    };

    const copyCombinations = async () => {
        if (!currentCombinations.length) {
            generateCombinations();
        }

        const text = currentCombinations
            .map((combination, index) => `${index + 1}조합: ${combination.join(', ')}`)
            .join('\n');

        try {
            await navigator.clipboard.writeText(text);
            copyStatus.textContent = '생성한 조합을 모두 복사했습니다.';
        } catch {
            copyStatus.textContent = text;
        }
    };

    if (numberGrid) {
        renderNumberGrid();
        updateSelectionSummary();
    }

    generateBtn?.addEventListener('click', generateCombinations);
    copyBtn?.addEventListener('click', copyCombinations);
    clearSelectionBtn?.addEventListener('click', () => {
        fixedNumbers.clear();
        excludedNumbers.clear();
        renderNumberGrid();
        updateSelectionSummary();
        generateCombinations();
    });

    reloadWinningBtn?.addEventListener('click', loadWinningNumbers);
    drawSearchBtn?.addEventListener('click', lookupDraw);
    drawInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            lookupDraw();
        }
    });

    generateCombinations();
    loadWinningNumbers();
});
