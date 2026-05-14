if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const themeToggle = document.getElementById('theme-toggle');
    const themeStorageKey = 'lotto-theme';

    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem(themeStorageKey);
        if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
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

    themeToggle?.addEventListener('click', () => {
        const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(themeStorageKey, nextTheme);
        applyTheme(nextTheme);
    });

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
    const purchaseStat = document.getElementById('purchase-stat');
    const budgetInput = document.getElementById('budget-input');
    const budgetStatus = document.getElementById('budget-status');
    const matchSummary = document.getElementById('match-summary');
    const oddEvenFilter = document.getElementById('odd-even-filter');
    const rangeBalanceFilter = document.getElementById('range-balance-filter');
    const noConsecutiveFilter = document.getElementById('no-consecutive-filter');
    const themeChoices = document.querySelectorAll('.theme-choice');
    const themeStatus = document.getElementById('theme-status');
    const latestWinning = document.getElementById('latest-winning');
    const recentWinningList = document.getElementById('recent-winning-list');
    const reloadWinningBtn = document.getElementById('reload-winning-btn');

    const fixedNumbers = new Set();
    const excludedNumbers = new Set();
    let currentCombinations = [];
    let latestReferenceDraw = null;

    document.querySelectorAll('.button').forEach((button) => {
        button.addEventListener('click', () => {
            button.classList.remove('clicked');
            void button.offsetWidth;
            button.classList.add('clicked');
        });
        button.addEventListener('animationend', () => button.classList.remove('clicked'));
    });

    const allNumbers = Array.from({ length: 45 }, (_, index) => index + 1);
    const themePresets = {
        calm: {
            label: '차분한 집중',
            mode: 'balanced',
            oddEven: 'any',
            rangeBalance: 'balanced',
            noConsecutive: false,
            message: '차분한 집중 테마를 적용했습니다. 여러 번호대에 고르게 퍼진 조합을 만들기 좋습니다.'
        },
        fresh: {
            label: '가벼운 시작',
            mode: 'low',
            oddEven: 'any',
            rangeBalance: 'any',
            noConsecutive: false,
            message: '가벼운 시작 테마를 적용했습니다. 낮은 번호가 조금 더 보이도록 구성합니다.'
        },
        bold: {
            label: '또렷한 도전',
            mode: 'high',
            oddEven: 'any',
            rangeBalance: 'any',
            noConsecutive: false,
            message: '또렷한 도전 테마를 적용했습니다. 높은 번호가 포함되기 쉬운 조합으로 정리합니다.'
        },
        steady: {
            label: '고른 균형',
            mode: 'balanced',
            oddEven: '3-3',
            rangeBalance: 'balanced',
            noConsecutive: true,
            message: '고른 균형 테마를 적용했습니다. 홀짝과 번호대가 정돈된 조합을 만들기 좋습니다.'
        }
    };
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
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 4500);

        try {
            const response = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`, {
                signal: controller.signal
            });
            if (!response.ok) throw new Error('당첨번호 데이터를 불러오지 못했습니다.');

            const data = await response.json();
            if (data.returnValue !== 'success') throw new Error('아직 발표되지 않은 회차입니다.');

            return {
                drawNo: data.drwNo,
                date: data.drwNoDate,
                numbers: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
                bonus: data.bnusNo
            };
        } finally {
            window.clearTimeout(timeoutId);
        }
    };

    const findLatestDraw = async () => {
        let drawNo = getLatestDrawEstimate() + 2;
        for (let attempt = 0; attempt < 12; attempt += 1) {
            try {
                return await fetchDraw(drawNo);
            } catch (error) {
                if (error.message !== '아직 발표되지 않은 회차입니다.') throw error;
                drawNo -= 1;
            }
        }
        throw new Error('최근 회차를 찾지 못했습니다.');
    };

    const createBall = (number, extraClass = '', delay = 0) => {
        const ball = document.createElement('span');
        ball.className = `number-circle ${extraClass}`.trim();
        ball.textContent = number;
        ball.style.backgroundColor = getColor(number);
        if (delay > 0) ball.style.animationDelay = `${delay}ms`;
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

        latestReferenceDraw = fallbackDraws[0];
        latestWinning.innerHTML = '';
        latestWinning.appendChild(renderWinningCard(fallbackDraws[0]));

        recentWinningList.innerHTML = '';
        fallbackDraws.forEach((draw) => recentWinningList.appendChild(renderWinningCard(draw)));

        if (currentCombinations.length) updateMatchSummary(currentCombinations);

        try {
            const latestDraw = await findLatestDraw();
            latestReferenceDraw = latestDraw;
            latestWinning.innerHTML = '';
            latestWinning.appendChild(renderWinningCard(latestDraw));

            const recentDraws = await Promise.all(
                Array.from({ length: 7 }, (_, index) => fetchDraw(latestDraw.drawNo - index))
            );

            recentWinningList.innerHTML = '';
            recentDraws.forEach((draw) => recentWinningList.appendChild(renderWinningCard(draw)));

            if (currentCombinations.length) updateMatchSummary(currentCombinations);
        } catch {
            const notice = document.createElement('p');
            notice.className = 'fine-print';
            notice.textContent = '실시간 조회가 지연되어 저장된 최근 참고 데이터를 표시하고 있습니다.';
            recentWinningList.appendChild(notice);
        }
    };

    const updateSelectionSummary = () => {
        const fixed = Array.from(fixedNumbers).sort((a, b) => a - b);
        const excluded = Array.from(excludedNumbers).sort((a, b) => a - b);
        if (fixedSummary) fixedSummary.textContent = fixed.length ? fixed.join(', ') : '없음';
        if (excludedSummary) excludedSummary.textContent = excluded.length ? excluded.join(', ') : '없음';
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
                        if (copyStatus) copyStatus.textContent = '고정 번호는 최대 6개까지 선택할 수 있습니다.';
                        return;
                    }
                    fixedNumbers.add(number);
                } else if (fixedNumbers.has(number)) {
                    fixedNumbers.delete(number);
                    excludedNumbers.add(number);
                } else {
                    excludedNumbers.delete(number);
                }

                if (copyStatus) copyStatus.textContent = '';
                renderNumberGrid();
                updateSelectionSummary();
            });

            numberGrid.appendChild(button);
        });
    };

    const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

    const applyThemePreset = (presetKey) => {
        const preset = themePresets[presetKey];
        if (!preset) return;

        if (quickModeSelect) quickModeSelect.value = preset.mode;
        if (oddEvenFilter) oddEvenFilter.value = preset.oddEven;
        if (rangeBalanceFilter) rangeBalanceFilter.value = preset.rangeBalance;
        if (noConsecutiveFilter) noConsecutiveFilter.checked = preset.noConsecutive;

        themeChoices.forEach((choice) => {
            const isActive = choice.dataset.themePreset === presetKey;
            choice.classList.toggle('active', isActive);
            choice.setAttribute('aria-pressed', String(isActive));
        });

        if (themeStatus) {
            themeStatus.textContent = `${preset.message} 테마는 분위기를 정하는 기능이며 당첨을 예측하지 않습니다.`;
        }
    };

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
            if (candidate && !selected.includes(candidate) && !excludedNumbers.has(candidate)) selected.push(candidate);
            guard += 1;
        }

        if (selected.length < 6) {
            const fallbackPool = allNumbers.filter((number) => !selected.includes(number) && !excludedNumbers.has(number));
            while (selected.length < 6 && fallbackPool.length) {
                const index = Math.floor(Math.random() * fallbackPool.length);
                selected.push(fallbackPool.splice(index, 1)[0]);
            }
        }

        if (selected.length < 6) throw new Error('선택 조건이 너무 많아 조합을 만들 수 없습니다.');
        return selected.sort((a, b) => a - b);
    };

    const hasConsecutiveNumbers = (combination) => {
        return combination.some((number, index) => index > 0 && number - combination[index - 1] === 1);
    };

    const hasBalancedRanges = (combination) => {
        const usedRanges = new Set(combination.map((number) => {
            if (number <= 10) return '1';
            if (number <= 20) return '2';
            if (number <= 30) return '3';
            if (number <= 40) return '4';
            return '5';
        }));

        return usedRanges.size >= 4;
    };

    const passesFilters = (combination) => {
        const oddCount = combination.filter((number) => number % 2 === 1).length;
        const evenCount = combination.length - oddCount;
        const oddEvenValue = oddEvenFilter?.value || 'any';

        if (oddEvenValue !== 'any') {
            const [targetOdd, targetEven] = oddEvenValue.split('-').map(Number);
            if (oddCount !== targetOdd || evenCount !== targetEven) return false;
        }
        if (rangeBalanceFilter?.value === 'balanced' && !hasBalancedRanges(combination)) return false;
        if (noConsecutiveFilter?.checked && hasConsecutiveNumbers(combination)) return false;

        return true;
    };

    const generateFilteredCombination = () => {
        for (let attempt = 0; attempt < 700; attempt += 1) {
            const combination = generateCombination();
            if (passesFilters(combination)) return combination;
        }
        throw new Error('조건에 맞는 조합을 만들기 어렵습니다. 필터를 조금 완화해 주세요.');
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

        return counts.filter((range) => range.count > 0).map((range) => `${range.label} ${range.count}개`).join(', ');
    };

    const updatePurchaseEstimate = (combinationCount) => {
        const estimatedPrice = combinationCount * 1000;
        if (purchaseStat) purchaseStat.textContent = `${estimatedPrice.toLocaleString('ko-KR')}원`;

        if (!budgetStatus) return;
        const budget = Number(budgetInput?.value || 0);
        if (!budget) {
            budgetStatus.textContent = '예산을 입력하면 예상 구매 금액과 비교할 수 있습니다.';
            budgetStatus.classList.remove('warning');
            return;
        }

        const remaining = budget - estimatedPrice;
        if (remaining >= 0) {
            budgetStatus.textContent = `예산 ${budget.toLocaleString('ko-KR')}원 중 ${remaining.toLocaleString('ko-KR')}원이 남습니다.`;
            budgetStatus.classList.remove('warning');
        } else {
            budgetStatus.textContent = `예산을 ${Math.abs(remaining).toLocaleString('ko-KR')}원 초과합니다. 조합 수를 줄여보세요.`;
            budgetStatus.classList.add('warning');
        }
    };

    const updateMatchSummary = (combinations) => {
        if (!matchSummary || !combinations.length) return;
        const draw = latestReferenceDraw || fallbackDraws[0];
        const winningSet = new Set(draw.numbers);
        const results = combinations.map((combination, index) => {
            const matches = combination.filter((number) => winningSet.has(number));
            const hasBonus = combination.includes(draw.bonus);
            return { index, matches, hasBonus };
        });
        const best = results.reduce((currentBest, item) => {
            if (item.matches.length > currentBest.matches.length) return item;
            if (item.matches.length === currentBest.matches.length && item.hasBonus && !currentBest.hasBonus) return item;
            return currentBest;
        }, results[0]);

        const matchText = best.matches.length ? `${best.matches.join(', ')} 일치` : '일치 번호 없음';
        const bonusText = best.hasBonus ? ' / 보너스 번호 포함' : '';
        matchSummary.innerHTML = `
            <strong>최근 ${draw.drawNo}회차 비교</strong>
            <span>${best.index + 1}조합: ${matchText}${bonusText}</span>
        `;
    };

    const updateStats = (combinations) => {
        if (!combinations.length) return;

        const sums = combinations.map((combo) => combo.reduce((total, number) => total + number, 0));
        const oddCounts = combinations.map((combo) => combo.filter((number) => number % 2 === 1).length);
        const averageSum = Math.round(sums.reduce((total, sum) => total + sum, 0) / sums.length);
        const averageOdd = (oddCounts.reduce((total, count) => total + count, 0) / oddCounts.length).toFixed(1);

        if (comboCountStat) comboCountStat.textContent = `${combinations.length}개`;
        if (sumStat) sumStat.textContent = `${averageSum}`;
        if (oddEvenStat) oddEvenStat.textContent = `홀 ${averageOdd} / 짝 ${(6 - Number(averageOdd)).toFixed(1)}`;
        if (rangeStat) rangeStat.textContent = summarizeRanges(combinations);
        updatePurchaseEstimate(combinations.length);
        updateMatchSummary(combinations);
    };

    const displayCombinations = (combinations) => {
        if (!combinationsContainer) return;
        combinationsContainer.innerHTML = '';

        combinations.forEach((combination, index) => {
            const row = document.createElement('article');
            row.className = 'combination-row';

            const label = document.createElement('strong');
            label.textContent = `${index + 1}조합`;

            const balls = document.createElement('div');
            balls.className = 'combination-balls';
            const randomDelays = combination.map((_, ballIndex) => ballIndex * 105).sort(() => Math.random() - 0.5);

            combination.forEach((number, ballIndex) => {
                const delay = index * 160 + randomDelays[ballIndex];
                balls.appendChild(createBall(number, 'generated-ball', delay));
            });

            row.append(label, balls);
            combinationsContainer.appendChild(row);
        });

        updateStats(combinations);
    };

    const showEmptyGeneratorState = () => {
        if (!combinationsContainer) return;
        combinationsContainer.innerHTML = '<p class="empty-card">조합 생성 버튼을 누르면 번호가 표시됩니다.</p>';
        if (comboCountStat) comboCountStat.textContent = '-';
        if (sumStat) sumStat.textContent = '-';
        if (oddEvenStat) oddEvenStat.textContent = '-';
        if (rangeStat) rangeStat.textContent = '-';
        if (purchaseStat) purchaseStat.textContent = '-';
        if (budgetStatus) budgetStatus.textContent = '예산을 입력하면 예상 구매 금액과 비교할 수 있습니다.';
        if (matchSummary) matchSummary.innerHTML = '';
    };

    const generateCombinations = () => {
        if (!generateBtn || !combinationsContainer) return;

        const requestedCount = Math.min(50, Math.max(1, Number(combinationCountInput?.value || 1)));
        if (combinationCountInput) combinationCountInput.value = requestedCount;
        currentCombinations = [];

        try {
            for (let index = 0; index < requestedCount; index += 1) {
                currentCombinations.push(generateFilteredCombination());
            }
            displayCombinations(currentCombinations);
            if (copyStatus) copyStatus.textContent = '';
        } catch (error) {
            if (copyStatus) copyStatus.textContent = error.message;
        }
    };

    const copyCombinations = async () => {
        if (!currentCombinations.length) generateCombinations();

        const text = currentCombinations.map((combination, index) => `${index + 1}조합: ${combination.join(', ')}`).join('\n');

        try {
            await navigator.clipboard.writeText(text);
            if (copyStatus) copyStatus.innerHTML = '생성된 조합을 복사했습니다.<br>메모장, 메시지, 기록 앱 등에 붙여넣을 수 있습니다.';
        } catch {
            if (copyStatus) copyStatus.textContent = text;
        }
    };

    if (numberGrid) {
        renderNumberGrid();
        updateSelectionSummary();
    }

    themeChoices.forEach((choice) => {
        choice.setAttribute('aria-pressed', choice.classList.contains('active') ? 'true' : 'false');
        choice.addEventListener('click', () => applyThemePreset(choice.dataset.themePreset));
    });

    generateBtn?.addEventListener('click', generateCombinations);
    copyBtn?.addEventListener('click', copyCombinations);
    budgetInput?.addEventListener('input', () => updatePurchaseEstimate(currentCombinations.length));
    clearSelectionBtn?.addEventListener('click', () => {
        fixedNumbers.clear();
        excludedNumbers.clear();
        renderNumberGrid();
        updateSelectionSummary();
        if (copyStatus) copyStatus.textContent = '고정 번호와 제외 번호 선택을 초기화했습니다.';
    });
    reloadWinningBtn?.addEventListener('click', loadWinningNumbers);

    showEmptyGeneratorState();
    loadWinningNumbers();
});
