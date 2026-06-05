// --- Anchor Pachinko Simulator Logic ---

// --- Configuration & Node Maps ---
const config = {
    fig1: {
        title: "Fig. 1 アンカーパチンコの例",
        ports: ['A', 'B', 'C'],
        numAnchors: 8,
        portPositions: [
            { label: 'A', x: 150, y: 60 },
            { label: 'B', x: 300, y: 60 },
            { label: 'C', x: 450, y: 60 }
        ],
        anchors: [
            { id: 1, x: 150, y: 150 },
            { id: 2, x: 300, y: 150 },
            { id: 3, x: 450, y: 150 },
            { id: 4, x: 225, y: 300 },
            { id: 5, x: 375, y: 300 },
            { id: 6, x: 150, y: 450 },
            { id: 7, x: 300, y: 450 },
            { id: 8, x: 450, y: 450 }
        ],
        goal: { x: 300, y: 640 },
        walls: {
            left: "M 100,50 L 100,100 L 70,180 L 70,380 L 100,420 L 70,480 L 70,600 L 280,630 L 280,670",
            right: "M 500,50 L 500,100 L 530,180 L 530,380 L 500,420 L 530,480 L 530,600 L 320,630 L 320,670"
        },
        pegs: [
            { x: 225, y: 150 }, { x: 375, y: 150 },
            { x: 150, y: 300 }, { x: 300, y: 300 }, { x: 450, y: 300 },
            { x: 225, y: 450 }, { x: 375, y: 450 }
        ]
    },
    fig3: {
        title: "Fig. 3 もう1つの台",
        ports: ['A', 'B', 'C', 'D'],
        numAnchors: 18,
        portPositions: [
            { label: 'A', x: 120, y: 60 },
            { label: 'B', x: 240, y: 60 },
            { label: 'C', x: 360, y: 60 },
            { label: 'D', x: 480, y: 60 }
        ],
        anchors: [
            { id: 1, x: 120, y: 120 },
            { id: 2, x: 240, y: 120 },
            { id: 3, x: 360, y: 120 },
            { id: 4, x: 480, y: 120 },
            { id: 5, x: 180, y: 220 },
            { id: 6, x: 300, y: 220 },
            { id: 7, x: 420, y: 220 },
            { id: 8, x: 120, y: 320 },
            { id: 9, x: 240, y: 320 },
            { id: 10, x: 360, y: 320 },
            { id: 11, x: 480, y: 320 },
            { id: 12, x: 180, y: 420 },
            { id: 13, x: 300, y: 420 },
            { id: 14, x: 420, y: 420 },
            { id: 15, x: 120, y: 520 },
            { id: 16, x: 240, y: 520 },
            { id: 17, x: 360, y: 520 },
            { id: 18, x: 480, y: 520 }
        ],
        goal: { x: 300, y: 660 },
        walls: {
            left: "M 80,50 L 80,80 L 60,150 L 60,280 L 80,300 L 60,350 L 60,480 L 80,500 L 60,550 L 60,630 L 280,650 L 280,680",
            right: "M 520,50 L 520,80 L 540,150 L 540,280 L 500,300 L 540,350 L 540,480 L 500,500 L 540,550 L 540,630 L 320,650 L 320,680"
        },
        pegs: [
            { x: 180, y: 120 }, { x: 300, y: 120 }, { x: 420, y: 120 },
            { x: 120, y: 220 }, { x: 240, y: 220 }, { x: 360, y: 220 }, { x: 480, y: 220 },
            { x: 180, y: 320 }, { x: 300, y: 320 }, { x: 420, y: 320 },
            { x: 120, y: 420 }, { x: 240, y: 420 }, { x: 360, y: 420 }, { x: 480, y: 420 },
            { x: 180, y: 520 }, { x: 300, y: 520 }, { x: 420, y: 520 }
        ]
    }
};

// --- App State ---
let currentBoardId = 'fig1';
let anchorStates = []; // 0: L (Left), 1: R (Right). すべてRで初期化。
let dropCounters = {}; // 各ポートの投入数
let totalDropCount = 0;
let isAnimating = false;
let animationQueue = [];
let autoPlayInterval = null;

// --- DOM References ---
const svgElement = document.getElementById('pachinko-svg');
const wallsGroup = document.getElementById('board-walls');
const anchorsGroup = document.getElementById('board-anchors');
const tracksGroup = document.getElementById('board-tracks');
const ballElement = document.getElementById('ball');
const logConsole = document.getElementById('log-console');
const totalCountVal = document.getElementById('total-count-val');
const btnAutoRun = document.getElementById('btn-auto-run');

// --- Initialization ---
function init() {
    switchBoard(currentBoardId);
}

// 台の切り替え
function switchBoard(boardId) {
    if (isAnimating) return;
    
    currentBoardId = boardId;
    
    // タブのクラス更新
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${boardId}`).classList.add('active');
    
    // タイトル更新
    document.getElementById('board-title').textContent = config[boardId].title;
    
    // 状態とカウンターのリセット
    resetState();
    
    // UIの再構築
    buildBoardUI();
    buildControls();
    
    addLog(`台を「${config[boardId].title}」に切り替えました。`, 'system');
}

// 状態とカウンターの初期化
function resetState() {
    const board = config[currentBoardId];
    
    // いかりをすべて「R（右＝1）」に初期化
    anchorStates = new Array(board.numAnchors).fill(1);
    
    // カウンターの初期化
    dropCounters = {};
    board.ports.forEach(port => {
        dropCounters[port] = 0;
    });
    totalDropCount = 0;
    totalCountVal.textContent = "0";
    
    animationQueue = [];
    isAnimating = false;
    ballElement.style.display = 'none';
    btnAutoRun.disabled = true;
    btnAutoRun.textContent = "セットした玉を順次落とす";
    
    updateCounterUI();
}

// ボードのSVG描画構築
function buildBoardUI() {
    const board = config[currentBoardId];
    
    // SVGをクリア（defsを除く）
    while (svgElement.lastChild && svgElement.lastChild.tagName !== 'defs') {
        svgElement.removeChild(svgElement.lastChild);
    }
    
    // 壁グループの再追加
    const wallsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wallsG.id = 'board-walls';
    svgElement.appendChild(wallsG);
    
    // 壁を描画
    const leftWall = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    leftWall.setAttribute('d', board.walls.left);
    leftWall.setAttribute('class', 'wall-path');
    wallsG.appendChild(leftWall);
    
    const rightWall = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rightWall.setAttribute('d', board.walls.right);
    rightWall.setAttribute('class', 'wall-path');
    wallsG.appendChild(rightWall);
    
    // 排出口の底壁を追加
    const bottomWall = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const bottomD = `M 280,670 L 280,690 L 320,690 L 320,670`;
    bottomWall.setAttribute('d', bottomD);
    bottomWall.setAttribute('class', 'wall-path');
    bottomWall.setAttribute('stroke-width', '4');
    wallsG.appendChild(bottomWall);

    // ガイドピン（障害物ピン）の描画
    board.pegs.forEach(peg => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', peg.x);
        circle.setAttribute('cy', peg.y);
        circle.setAttribute('r', '5');
        circle.setAttribute('class', 'peg');
        svgElement.appendChild(circle);
    });

    // いかりグループの再追加
    const anchorsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    anchorsG.id = 'board-anchors';
    svgElement.appendChild(anchorsG);

    // いかりを描画
    board.anchors.forEach((anchor, index) => {
        const anchorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        anchorGroup.setAttribute('id', `anchor-${index}`);
        anchorGroup.setAttribute('class', 'anchor-group');
        anchorGroup.setAttribute('transform', `translate(${anchor.x}, ${anchor.y}) rotate(30)`);
        
        // いかりの背後にある固定ピン
        const base = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        base.setAttribute('cx', '0');
        base.setAttribute('cy', '0');
        base.setAttribute('r', '8');
        base.setAttribute('class', 'anchor-base');
        anchorGroup.appendChild(base);

        // 錨本体の形状
        const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // 美しい錨の形状をパスで定義
        const anchorD = "M 0,-8 L 0,16 M -18,12 C -18,22 18,22 18,12 M -22,8 L -18,12 L -14,8 M 22,8 L 18,12 L 14,8";
        shape.setAttribute('d', anchorD);
        shape.setAttribute('class', 'anchor-shape anchor-shape-r');
        shape.setAttribute('id', `anchor-shape-${index}`);
        anchorGroup.appendChild(shape);

        // レバーピン（つまみ）
        const pin = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        pin.setAttribute('x1', '0');
        pin.setAttribute('y1', '0');
        pin.setAttribute('x2', '0');
        pin.setAttribute('y2', '-22');
        pin.setAttribute('class', 'anchor-shape');
        pin.setAttribute('stroke', '#ffcc00');
        pin.setAttribute('stroke-width', '3');
        anchorGroup.appendChild(pin);

        const pinHead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pinHead.setAttribute('cx', '0');
        pinHead.setAttribute('cy', '-22');
        pinHead.setAttribute('r', '4.5');
        pinHead.setAttribute('class', 'anchor-pin');
        anchorGroup.appendChild(pinHead);

        // ラベル（番号表示）
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '0');
        label.setAttribute('y', '32');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#9ca3af');
        label.setAttribute('font-size', '11');
        label.setAttribute('font-family', 'Outfit');
        label.textContent = anchor.id;
        anchorGroup.appendChild(label);

        // クリックしていかりを直接手動で反転できるようにする
        anchorGroup.addEventListener('click', () => toggleAnchor(index));

        anchorsG.appendChild(anchorGroup);
    });

    // ボールを最前面に再追加
    svgElement.appendChild(ballElement);
    ballElement.style.display = 'none';
    
    // いかりの状態をUIに同期
    updateAnchorsUI();
}

// コントロールボタンとカウンター領域の生成
function buildControls() {
    const board = config[currentBoardId];
    
    // 投入ボタンの生成
    const buttonsContainer = document.getElementById('drop-buttons-container');
    buttonsContainer.innerHTML = '';
    board.ports.forEach((port, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-drop-port';
        btn.id = `btn-drop-${port}`;
        btn.innerHTML = `⬇️ ${port}`;
        btn.onclick = () => dropBall(idx);
        buttonsContainer.appendChild(btn);
    });

    // カウンターの生成
    const countersContainer = document.getElementById('counters-container');
    countersContainer.innerHTML = '';
    board.ports.forEach(port => {
        const box = document.createElement('div');
        box.className = 'counter-box';
        box.innerHTML = `
            <span class="label">Port ${port}</span>
            <span id="counter-val-${port}" class="number-display">0</span>
        `;
        countersContainer.appendChild(box);
    });
}

// いかり状態の手動切り替え
function toggleAnchor(index) {
    if (isAnimating) return;
    anchorStates[index] = 1 - anchorStates[index];
    updateAnchorsUI();
    const dir = anchorStates[index] === 1 ? '右（R）' : '左（L）';
    addLog(`いかり ${index + 1}番 を手動で「${dir}」に変更しました。`, 'action');
}

// いかりの向きのUI更新（回転角度の適用）
function updateAnchorsUI() {
    anchorStates.forEach((state, index) => {
        const group = document.getElementById(`anchor-${index}`);
        const shape = document.getElementById(`anchor-shape-${index}`);
        if (group && shape) {
            if (state === 1) { // R (右にピンが倒れている＝玉は左へ流れる)
                group.setAttribute('transform', `translate(${config[currentBoardId].anchors[index].x}, ${config[currentBoardId].anchors[index].y}) rotate(25)`);
                shape.setAttribute('class', 'anchor-shape anchor-shape-r');
            } else { // L (左にピンが倒れている＝玉は右へ流れる)
                group.setAttribute('transform', `translate(${config[currentBoardId].anchors[index].x}, ${config[currentBoardId].anchors[index].y}) rotate(-25)`);
                shape.setAttribute('class', 'anchor-shape anchor-shape-l');
            }
        }
    });
}

// カウンターUIの更新
function updateCounterUI() {
    const board = config[currentBoardId];
    board.ports.forEach(port => {
        const counterEl = document.getElementById(`counter-val-${port}`);
        if (counterEl) {
            counterEl.textContent = dropCounters[port];
        }
    });
    totalCountVal.textContent = totalDropCount;
}

// ログ出力関数
function addLog(message, type = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    entry.textContent = `[${timeStr}] ${message}`;
    logConsole.appendChild(entry);
    logConsole.scrollTop = logConsole.scrollHeight;
}

// --- ボールの落下軌道の計算ロジック ---

// 特定の投入口から落ちるときの経路座標リストを生成する
function calculateTrajectory(portIndex) {
    const board = config[currentBoardId];
    const traj = [];
    
    // 開始点 (投入口)
    const startPort = board.portPositions[portIndex];
    traj.push({ x: startPort.x, y: startPort.y });
    
    let currentIdx = portIndex; // 最初のイカリのインデックス
    let currentState = [...anchorStates]; // シミュレーション中の一時状態
    
    // Fig 1 の遷移トポロジー
    function getNextNodeFig1(node, dir) {
        if (dir === 1) { // R -> 左へ
            if (node === 0) return { next: 5, path: [{ x: 80, y: 200 }, { x: 80, y: 380 }, { x: 150, y: 450 }] }; // 1 -> 6 (左壁)
            if (node === 1) return { next: 3, path: [{ x: 225, y: 300 }] }; // 2 -> 4
            if (node === 2) return { next: 4, path: [{ x: 375, y: 300 }] }; // 3 -> 5
            if (node === 3) return { next: 5, path: [{ x: 150, y: 450 }] }; // 4 -> 6
            if (node === 4) return { next: 6, path: [{ x: 300, y: 450 }] }; // 5 -> 7
            // 最下行からの排出
            if (node === 5) return { next: null, path: [{ x: 80, y: 500 }, { x: 80, y: 600 }, board.goal] }; // 6 -> ゴール (左壁)
            if (node === 6) return { next: null, path: [board.goal] }; // 7 -> ゴール
            if (node === 7) return { next: null, path: [{ x: 375, y: 550 }, board.goal] }; // 8 -> ゴール
        } else { // L -> 右へ
            if (node === 0) return { next: 3, path: [{ x: 225, y: 300 }] }; // 1 -> 4
            if (node === 1) return { next: 4, path: [{ x: 375, y: 300 }] }; // 2 -> 5
            if (node === 2) return { next: 7, path: [{ x: 520, y: 200 }, { x: 520, y: 380 }, { x: 450, y: 450 }] }; // 3 -> 8 (右壁)
            if (node === 3) return { next: 6, path: [{ x: 300, y: 450 }] }; // 4 -> 7
            if (node === 4) return { next: 7, path: [{ x: 450, y: 450 }] }; // 5 -> 8
            // 最下行から排出
            if (node === 5) return { next: null, path: [{ x: 225, y: 550 }, board.goal] }; // 6 -> ゴール
            if (node === 6) return { next: null, path: [board.goal] }; // 7 -> ゴール
            if (node === 7) return { next: null, path: [{ x: 520, y: 500 }, { x: 520, y: 600 }, board.goal] }; // 8 -> ゴール (右壁)
        }
    }

    // Fig 3 の遷移トポロジー
    function getNextNodeFig3(node, dir) {
        if (dir === 1) { // R -> 左へ
            if (node === 0) return { next: 7, path: [{ x: 80, y: 170 }, { x: 80, y: 270 }, { x: 120, y: 320 }] }; // 1 -> 8 (左壁)
            if (node === 1) return { next: 4, path: [{ x: 180, y: 220 }] }; // 2 -> 5
            if (node === 2) return { next: 5, path: [{ x: 300, y: 220 }] }; // 3 -> 6
            if (node === 3) return { next: 6, path: [{ x: 420, y: 220 }] }; // 4 -> 7
            
            if (node === 4) return { next: 7, path: [{ x: 120, y: 320 }] }; // 5 -> 8
            if (node === 5) return { next: 8, path: [{ x: 240, y: 320 }] }; // 6 -> 9
            if (node === 6) return { next: 9, path: [{ x: 360, y: 320 }] }; // 7 -> 10
            
            if (node === 7) return { next: 14, path: [{ x: 80, y: 370 }, { x: 80, y: 470 }, { x: 120, y: 520 }] }; // 8 -> 15 (左壁)
            if (node === 8) return { next: 11, path: [{ x: 180, y: 420 }] }; // 9 -> 12
            if (node === 9) return { next: 12, path: [{ x: 300, y: 420 }] }; // 10 -> 13
            if (node === 10) return { next: 13, path: [{ x: 420, y: 420 }] }; // 11 -> 14
            
            if (node === 11) return { next: 14, path: [{ x: 120, y: 520 }] }; // 12 -> 15
            if (node === 12) return { next: 15, path: [{ x: 240, y: 520 }] }; // 13 -> 16
            if (node === 13) return { next: 16, path: [{ x: 360, y: 520 }] }; // 14 -> 17
            
            // 最下行から排出 (15〜18)
            if (node === 14) return { next: null, path: [{ x: 80, y: 570 }, { x: 80, y: 630 }, board.goal] }; // 15 -> ゴール (左壁)
            if (node === 15) return { next: null, path: [{ x: 270, y: 590 }, board.goal] }; // 16 -> ゴール
            if (node === 16) return { next: null, path: [{ x: 330, y: 590 }, board.goal] }; // 17 -> ゴール
            if (node === 17) return { next: null, path: [{ x: 390, y: 590 }, board.goal] }; // 18 -> ゴール
        } else { // L -> 右へ
            if (node === 0) return { next: 4, path: [{ x: 180, y: 220 }] }; // 1 -> 5
            if (node === 1) return { next: 5, path: [{ x: 300, y: 220 }] }; // 2 -> 6
            if (node === 2) return { next: 6, path: [{ x: 420, y: 220 }] }; // 3 -> 7
            if (node === 3) return { next: 10, path: [{ x: 520, y: 170 }, { x: 520, y: 270 }, { x: 480, y: 320 }] }; // 4 -> 11 (右壁)
            
            if (node === 4) return { next: 8, path: [{ x: 240, y: 320 }] }; // 5 -> 9
            if (node === 5) return { next: 9, path: [{ x: 360, y: 320 }] }; // 6 -> 10
            if (node === 6) return { next: 10, path: [{ x: 480, y: 320 }] }; // 7 -> 11
            
            if (node === 7) return { next: 11, path: [{ x: 180, y: 420 }] }; // 8 -> 12
            if (node === 8) return { next: 12, path: [{ x: 300, y: 420 }] }; // 9 -> 13
            if (node === 9) return { next: 13, path: [{ x: 420, y: 420 }] }; // 10 -> 14
            if (node === 10) return { next: 17, path: [{ x: 520, y: 370 }, { x: 520, y: 470 }, { x: 480, y: 520 }] }; // 11 -> 18 (右壁)
            
            if (node === 11) return { next: 15, path: [{ x: 240, y: 520 }] }; // 12 -> 16
            if (node === 12) return { next: 16, path: [{ x: 360, y: 520 }] }; // 13 -> 17
            if (node === 13) return { next: 17, path: [{ x: 480, y: 520 }] }; // 14 -> 18
            
            // 最下行から排出
            if (node === 14) return { next: null, path: [{ x: 210, y: 590 }, board.goal] }; // 15 -> ゴール
            if (node === 15) return { next: null, path: [{ x: 270, y: 590 }, board.goal] }; // 16 -> ゴール
            if (node === 16) return { next: null, path: [{ x: 330, y: 590 }, board.goal] }; // 17 -> ゴール
            if (node === 17) return { next: null, path: [{ x: 520, y: 570 }, { x: 520, y: 630 }, board.goal] }; // 18 -> ゴール (右壁)
        }
    }

    const getNextNode = currentBoardId === 'fig1' ? getNextNodeFig1 : getNextNodeFig3;
    
    // 落下シミュレーションのステップ実行
    while (currentIdx !== null) {
        const anchor = board.anchors[currentIdx];
        const dir = currentState[currentIdx];
        
        // このいかりに到達したポイントを追加（ここで反転がトリガーされる）
        traj.push({
            x: anchor.x,
            y: anchor.y,
            triggerAnchor: currentIdx,
            targetDir: 1 - dir,
            logMsg: `いかり ${anchor.id}番 に接触: ${dir === 1 ? '右(R)' : '左(L)'} ➔ ${dir === 1 ? '左(L)' : '右(R)'} にカタカタと反転し、ボールは${dir === 1 ? '左側' : '右側'}へ。`
        });
        
        const result = getNextNode(currentIdx, dir);
        
        // トグルして状態を更新
        currentState[currentIdx] = 1 - dir;
        
        // 次のノードがある場合、pathの最後の要素（次のノードの座標）は重複するため除外する
        let pathToAdd = result.path;
        if (result.next !== null && pathToAdd.length > 0) {
            pathToAdd = pathToAdd.slice(0, -1);
        }
        
        pathToAdd.forEach(pos => {
            traj.push({ x: pos.x, y: pos.y });
        });
        
        currentIdx = result.next;
    }
    
    return { trajectory: traj, finalStates: currentState };
}

// --- アニメーション制御 ---

// 玉を落とす
function dropBall(portIndex) {
    if (isAnimating) return;
    
    const board = config[currentBoardId];
    const portLabel = board.ports[portIndex];
    
    // カウンターインクリメント
    dropCounters[portLabel]++;
    totalDropCount++;
    updateCounterUI();
    
    addLog(`投入口 ${portLabel} からボールを落としました。`, 'action');
    
    const simResult = calculateTrajectory(portIndex);
    
    // ボタンの無効化
    setControlsDisabled(true);
    isAnimating = true;
    
    // アニメーション実行
    animateBall(simResult.trajectory, () => {
        // アニメーション完了後
        addLog(`ボールが排出口に達しました。`, 'system');
        
        isAnimating = false;
        setControlsDisabled(false);
        
        // キューに次の玉があれば実行
        if (animationQueue.length > 0) {
            const nextPortIdx = animationQueue.shift();
            // 自動実行の残り個数を表示
            if (animationQueue.length > 0) {
                btnAutoRun.textContent = `自動投入中... (残り ${animationQueue.length + 1} 個)`;
            } else {
                btnAutoRun.textContent = "自動投入完了";
                setTimeout(() => {
                    btnAutoRun.textContent = "セットした玉を順次落とす";
                    btnAutoRun.disabled = true;
                }, 1500);
            }
            // 少し遅延を挟んでから次のボールを落とす
            setTimeout(() => {
                dropBall(nextPortIdx);
            }, 300);
        }
    });
}

// コントロールボタンの無効化・有効化
function setControlsDisabled(disabled) {
    document.querySelectorAll('.btn-drop-port').forEach(btn => btn.disabled = disabled);
    document.querySelectorAll('.tab-btn').forEach(btn => btn.disabled = disabled);
    document.getElementById('btn-reset').disabled = disabled;
    document.getElementById('btn-shortcut-fig1').disabled = disabled;
    document.getElementById('btn-shortcut-fig3').disabled = disabled;
    
    // 自動実行中なら自動実行ボタン自体の活性状態は別で管理
    if (!disabled && animationQueue.length === 0) {
        btnAutoRun.disabled = true;
    }
}

// 座標リストに沿ってボールを滑らかに移動させる
function animateBall(path, onComplete) {
    ballElement.style.display = 'block';
    
    let pathIndex = 0;
    let currentPos = { x: path[0].x, y: path[0].y };
    
    ballElement.setAttribute('cx', currentPos.x);
    ballElement.setAttribute('cy', currentPos.y);
    
    function updateFrame() {
        // スライダーから現在の落下速度を動的に読み取る
        const speedSlider = document.getElementById('speed-slider');
        const speed = speedSlider ? parseFloat(speedSlider.value) : 10;
        
        if (pathIndex >= path.length - 1) {
            // アニメーション終了
            ballElement.style.display = 'none';
            onComplete();
            return;
        }
        
        const target = path[pathIndex + 1];
        const dx = target.x - currentPos.x;
        const dy = target.y - currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= speed) {
            // 次のポイントに到達
            currentPos.x = target.x;
            currentPos.y = target.y;
            pathIndex++;
            
            // いかり接触イベントをトリガー（接触した瞬間に回転）
            if (target.triggerAnchor !== null && target.triggerAnchor !== undefined) {
                const anchorIdx = target.triggerAnchor;
                const targetDir = target.targetDir;
                
                // 内部状態を更新
                anchorStates[anchorIdx] = targetDir;
                
                // SVGのいかり要素の向きを更新
                const group = document.getElementById(`anchor-${anchorIdx}`);
                const shape = document.getElementById(`anchor-shape-${anchorIdx}`);
                if (group && shape) {
                    if (targetDir === 1) {
                        group.setAttribute('transform', `translate(${config[currentBoardId].anchors[anchorIdx].x}, ${config[currentBoardId].anchors[anchorIdx].y}) rotate(25)`);
                        shape.setAttribute('class', 'anchor-shape anchor-shape-r');
                    } else {
                        group.setAttribute('transform', `translate(${config[currentBoardId].anchors[anchorIdx].x}, ${config[currentBoardId].anchors[anchorIdx].y}) rotate(-25)`);
                        shape.setAttribute('class', 'anchor-shape anchor-shape-l');
                    }
                }
                
                // リアルタイム接触ログ出力
                if (target.logMsg) {
                    addLog(target.logMsg);
                }
            }
        } else {
            // 目標に向かって一定速度で移動
            currentPos.x += (dx / dist) * speed;
            currentPos.y += (dy / dist) * speed;
        }
        
        ballElement.setAttribute('cx', currentPos.x);
        ballElement.setAttribute('cy', currentPos.y);
        
        requestAnimationFrame(updateFrame);
    }
    
    requestAnimationFrame(updateFrame);
}

// --- 解答検証の自動セットと実行 ---

// Fig 1 の解答 (A:1, B:5, C:1) をセット
function applyAnswerFig1() {
    if (isAnimating) return;
    switchBoard('fig1');
    
    // A: 0, B: 1, C: 2
    // A*1, B*5, C*1 -> [0, 1, 1, 1, 1, 1, 2]
    animationQueue = [0, 1, 1, 1, 1, 1, 2];
    
    btnAutoRun.disabled = false;
    btnAutoRun.textContent = `セットした玉を順次落とす (7個)`;
    addLog("Fig 1 の解答 (A:1, B:5, C:1) を自動投入キューにセットしました。「順次落とす」ボタンを押してください。", "system");
}

// Fig 3 の解答 (A:13, B:9, C:5, D:1) をセット
function applyAnswerFig3() {
    if (isAnimating) return;
    switchBoard('fig3');
    
    // A: 0, B: 1, C: 2, D: 3
    // A*13, B*9, C*5, D*1
    animationQueue = [];
    for (let i = 0; i < 13; i++) animationQueue.push(0);
    for (let i = 0; i < 9; i++) animationQueue.push(1);
    for (let i = 0; i < 5; i++) animationQueue.push(2);
    for (let i = 0; i < 1; i++) animationQueue.push(3);
    
    btnAutoRun.disabled = false;
    btnAutoRun.textContent = `セットした玉を順次落とす (28個)`;
    addLog("Fig 3 の解答 (A:13, B:9, C:5, D:1) を自動投入キューにセットしました。「順次落とす」ボタンを押してください。", "system");
}

// キューに入った玉を自動で順次実行する
function runQueuedBalls() {
    if (isAnimating || animationQueue.length === 0) return;
    
    const nextPortIdx = animationQueue.shift();
    btnAutoRun.disabled = true;
    btnAutoRun.textContent = `自動投入中... (残り ${animationQueue.length + 1} 個)`;
    
    dropBall(nextPortIdx);
}

// リセット
function resetBoard() {
    if (isAnimating) return;
    resetState();
    buildBoardUI();
    addLog("パチンコ台といかり、投入カウンターを初期状態にリセットしました。", "system");
}

// スライダー用の速度数値表示の更新
function updateSpeedLabel(value) {
    const label = document.getElementById('speed-val');
    if (label) label.textContent = value;
}

// 起動時にロード
window.onload = init;
