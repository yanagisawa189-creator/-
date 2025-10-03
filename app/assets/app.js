// 沖縄本島 防災計画比較システム JavaScript

let evacuationData = [];
let filteredData = [];
let currentSort = { column: null, direction: 'asc' };
let chart = null;

// データ読み込み
async function loadEvacuationData() {
    try {
        // サンプルデータを使用（実際の実装では ../data/normalized/sample_evacuation_data.csv を読み込み）
        evacuationData = [
            {
                municipality_id: "JP-OKI-NAHA",
                municipality_name: "那覇市",
                designated_shelters: 45,
                emergency_evacuation_sites: 12,
                tsunami_evacuation_buildings: 8,
                total_facilities: 65,
                supported_hazards: "津波,洪水,地震,土砂災害",
                shelter_details: JSON.stringify([
                    {"name": "那覇市立城南小学校", "address": "那覇市古島1-1-1", "capacity": "500人", "notes": "津波避難ビル指定"},
                    {"name": "那覇市民会館", "address": "那覇市泉崎1-2-2", "capacity": "800人", "notes": "地震・洪水対応"}
                ])
            },
            {
                municipality_id: "JP-OKI-GINOWAN",
                municipality_name: "宜野湾市",
                designated_shelters: 32,
                emergency_evacuation_sites: 8,
                tsunami_evacuation_buildings: 6,
                total_facilities: 46,
                supported_hazards: "津波,洪水,地震",
                shelter_details: JSON.stringify([
                    {"name": "宜野湾市立普天間小学校", "address": "宜野湾市普天間2-33-1", "capacity": "400人", "notes": "津波避難場所"},
                    {"name": "宜野湾市民会館", "address": "宜野湾市野嵩1-1-2", "capacity": "600人", "notes": "地震対応"}
                ])
            },
            {
                municipality_id: "JP-OKI-URASOE",
                municipality_name: "浦添市",
                designated_shelters: 28,
                emergency_evacuation_sites: 10,
                tsunami_evacuation_buildings: 4,
                total_facilities: 42,
                supported_hazards: "津波,地震,洪水",
                shelter_details: JSON.stringify([
                    {"name": "浦添市立浦添中学校", "address": "浦添市安波茶2-1-1", "capacity": "350人", "notes": "津波・地震対応"},
                    {"name": "浦添市てだこホール", "address": "浦添市仲間1-9-3", "capacity": "500人", "notes": "地震・洪水対応"}
                ])
            },
            {
                municipality_id: "JP-OKI-NAGO",
                municipality_name: "名護市",
                designated_shelters: 38,
                emergency_evacuation_sites: 15,
                tsunami_evacuation_buildings: 7,
                total_facilities: 60,
                supported_hazards: "津波,洪水,地震,土砂災害",
                shelter_details: JSON.stringify([
                    {"name": "名護市立名護小学校", "address": "名護市東江1-8-11", "capacity": "450人", "notes": "津波避難ビル"},
                    {"name": "名護市民会館", "address": "名護市港1-1-1", "capacity": "700人", "notes": "全災害対応"}
                ])
            },
            {
                municipality_id: "JP-OKI-ITOMAN",
                municipality_name: "糸満市",
                designated_shelters: 25,
                emergency_evacuation_sites: 8,
                tsunami_evacuation_buildings: 5,
                total_facilities: 38,
                supported_hazards: "津波,地震,洪水",
                shelter_details: JSON.stringify([
                    {"name": "糸満市立糸満小学校", "address": "糸満市糸満1496", "capacity": "300人", "notes": "津波避難場所"},
                    {"name": "糸満市役所", "address": "糸満市潮崎町1-1", "capacity": "200人", "notes": "地震・洪水対応"}
                ])
            },
            {
                municipality_id: "JP-OKI-OKINAWA",
                municipality_name: "沖縄市",
                designated_shelters: 42,
                emergency_evacuation_sites: 12,
                tsunami_evacuation_buildings: 9,
                total_facilities: 63,
                supported_hazards: "津波,洪水,地震,土砂災害",
                shelter_details: JSON.stringify([
                    {"name": "沖縄市立美東中学校", "address": "沖縄市美原1-6-1", "capacity": "600人", "notes": "津波避難ビル"},
                    {"name": "沖縄市民小劇場あしびなー", "address": "沖縄市久保田3-1-12", "capacity": "400人", "notes": "地震・洪水対応"}
                ])
            },
            {
                municipality_id: "JP-OKI-URUMA",
                municipality_name: "うるま市",
                designated_shelters: 55,
                emergency_evacuation_sites: 18,
                tsunami_evacuation_buildings: 12,
                total_facilities: 85,
                supported_hazards: "津波,洪水,地震,土砂災害",
                shelter_details: JSON.stringify([
                    {"name": "うるま市立具志川小学校", "address": "うるま市江洲507", "capacity": "500人", "notes": "津波避難ビル"},
                    {"name": "うるま市民芸術劇場", "address": "うるま市前原東4-17-11", "capacity": "800人", "notes": "全災害対応"}
                ])
            },
            {
                municipality_id: "JP-OKI-YOMITAN",
                municipality_name: "読谷村",
                designated_shelters: 18,
                emergency_evacuation_sites: 7,
                tsunami_evacuation_buildings: 4,
                total_facilities: 29,
                supported_hazards: "津波,地震,洪水",
                shelter_details: JSON.stringify([
                    {"name": "読谷村立読谷小学校", "address": "読谷村座喜味2901", "capacity": "320人", "notes": "津波避難場所"},
                    {"name": "読谷村文化センター", "address": "読谷村座喜味1020-1", "capacity": "400人", "notes": "地震・洪水対応"}
                ])
            }
        ];
        
        filteredData = [...evacuationData];
        renderTable();
        updateStats();
        console.log('避難所データ読み込み完了:', evacuationData.length, '件');
        
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        document.getElementById('statsText').textContent = 'データの読み込みに失敗しました';
    }
}

// テーブル描画
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    filteredData.forEach(municipality => {
        const row = document.createElement('tr');
        
        // 災害種別バッジを生成
        const hazards = municipality.supported_hazards.split(',');
        const hazardBadges = hazards.map(hazard => {
            const className = getHazardClassName(hazard.trim());
            return `<span class="hazard-badge ${className}">${hazard.trim()}</span>`;
        }).join('');
        
        row.innerHTML = `
            <td class="municipality-name">${municipality.municipality_name}</td>
            <td class="number-cell">${municipality.designated_shelters}</td>
            <td class="number-cell">${municipality.emergency_evacuation_sites}</td>
            <td class="number-cell">${municipality.tsunami_evacuation_buildings}</td>
            <td class="number-cell">${municipality.total_facilities}</td>
            <td><div class="hazard-badges">${hazardBadges}</div></td>
            <td><button class="detail-btn" onclick="showDetail('${municipality.municipality_id}')">詳細</button></td>
        `;
        
        // 行クリックで詳細表示
        row.addEventListener('click', (e) => {
            if (!e.target.classList.contains('detail-btn')) {
                showDetail(municipality.municipality_id);
            }
        });
        
        tableBody.appendChild(row);
    });
}

// 災害種別のCSSクラス名を取得
function getHazardClassName(hazard) {
    const classMap = {
        '津波': 'tsunami',
        '洪水': 'flood',
        '地震': 'earthquake',
        '土砂災害': 'landslide'
    };
    return classMap[hazard] || '';
}

// ソート機能
function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    filteredData.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        // 数値の場合
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return currentSort.direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        // 文字列の場合
        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();
        
        if (currentSort.direction === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
    
    renderTable();
    updateSortArrows();
}

// ソート矢印を更新
function updateSortArrows() {
    document.querySelectorAll('.sort-arrow').forEach(arrow => {
        arrow.textContent = '↕';
    });
    
    if (currentSort.column) {
        const activeHeader = document.querySelector(`[data-column="${currentSort.column}"] .sort-arrow`);
        if (activeHeader) {
            activeHeader.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
        }
    }
}

// 検索機能
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            filteredData = [...evacuationData];
        } else {
            filteredData = evacuationData.filter(municipality =>
                municipality.municipality_name.toLowerCase().includes(searchTerm)
            );
        }
        
        renderTable();
        updateStats();
    });
}

// 検索クリア
function clearSearch() {
    document.getElementById('searchInput').value = '';
    filteredData = [...evacuationData];
    renderTable();
    updateStats();
}

// 災害種別フィルタ
function filterByHazard(hazardType) {
    // ボタンの状態を更新
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-hazard="${hazardType}"]`).classList.add('active');
    
    if (hazardType === 'all') {
        filteredData = [...evacuationData];
    } else {
        filteredData = evacuationData.filter(municipality =>
            municipality.supported_hazards.includes(hazardType)
        );
    }
    
    renderTable();
    updateStats();
    
    // チャートも更新
    if (document.getElementById('chartView').style.display !== 'none') {
        updateChart();
    }
}

// 表示切替
function toggleView(viewType) {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-container').forEach(container => {
        container.style.display = 'none';
    });
    
    if (viewType === 'table') {
        document.getElementById('tableView').style.display = 'block';
        document.getElementById('tableViewBtn').classList.add('active');
    } else {
        document.getElementById('chartView').style.display = 'block';
        document.getElementById('chartViewBtn').classList.add('active');
        updateChart();
    }
}

// チャート更新
function updateChart() {
    const metric = document.getElementById('chartMetric').value;
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    const labels = filteredData.map(m => m.municipality_name);
    const data = filteredData.map(m => m[metric]);
    
    const metricLabels = {
        'designated_shelters': '指定避難所数',
        'emergency_evacuation_sites': '緊急避難場所数',
        'tsunami_evacuation_buildings': '津波避難ビル数',
        'total_facilities': '総施設数'
    };
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: metricLabels[metric],
                data: data,
                backgroundColor: 'rgba(0, 160, 233, 0.7)',
                borderColor: 'rgba(0, 160, 233, 1)',
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(0, 160, 233, 1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            }
        }
    });
}

// 詳細表示
function showDetail(municipalityId) {
    const municipality = evacuationData.find(m => m.municipality_id === municipalityId);
    if (!municipality) return;
    
    document.getElementById('detailTitle').textContent = municipality.municipality_name + ' の避難施設';
    
    let shelterDetails = [];
    try {
        shelterDetails = JSON.parse(municipality.shelter_details || '[]');
    } catch (e) {
        console.warn('避難所詳細データのパースに失敗:', e);
    }
    
    const hazards = municipality.supported_hazards.split(',');
    const hazardBadges = hazards.map(hazard => {
        const className = getHazardClassName(hazard.trim());
        return `<span class="hazard-badge ${className}">${hazard.trim()}</span>`;
    }).join('');
    
    const shelterListHtml = shelterDetails.length > 0 ? `
        <div class="shelter-list">
            <h4>🏫 主要避難所</h4>
            ${shelterDetails.map(shelter => `
                <div class="shelter-item">
                    <div class="shelter-name">${shelter.name}</div>
                    <div class="shelter-info">
                        📍 ${shelter.address}<br>
                        👥 収容定員: ${shelter.capacity}<br>
                        📝 ${shelter.notes}
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '<p>詳細な避難所リストは現在準備中です。</p>';
    
    document.getElementById('detailContent').innerHTML = `
        <div class="detail-stat">
            <span class="stat-label">🏢 指定避難所</span>
            <span class="stat-value">${municipality.designated_shelters} 箇所</span>
        </div>
        <div class="detail-stat">
            <span class="stat-label">🚨 緊急避難場所</span>
            <span class="stat-value">${municipality.emergency_evacuation_sites} 箇所</span>
        </div>
        <div class="detail-stat">
            <span class="stat-label">🌊 津波避難ビル</span>
            <span class="stat-value">${municipality.tsunami_evacuation_buildings} 棟</span>
        </div>
        <div class="detail-stat">
            <span class="stat-label">📊 総施設数</span>
            <span class="stat-value">${municipality.total_facilities} 箇所</span>
        </div>
        <div class="detail-stat">
            <span class="stat-label">⚠️ 対応災害</span>
            <span>${hazardBadges}</span>
        </div>
        ${shelterListHtml}
    `;
    
    document.getElementById('detailPanel').style.display = 'block';
}

// 詳細パネルを閉じる
function closeDetail() {
    document.getElementById('detailPanel').style.display = 'none';
}

// 統計更新
function updateStats() {
    const total = filteredData.length;
    const totalShelters = filteredData.reduce((sum, m) => sum + m.designated_shelters, 0);
    const totalEmergency = filteredData.reduce((sum, m) => sum + m.emergency_evacuation_sites, 0);
    const totalTsunami = filteredData.reduce((sum, m) => sum + m.tsunami_evacuation_buildings, 0);
    const totalFacilities = filteredData.reduce((sum, m) => sum + m.total_facilities, 0);
    
    document.getElementById('statsText').innerHTML = `
        ${total} 市町村 | 
        指定避難所: ${totalShelters} 箇所 | 
        緊急避難場所: ${totalEmergency} 箇所 | 
        津波避難ビル: ${totalTsunami} 棟 | 
        総施設数: ${totalFacilities} 箇所
    `;
}

// イベントリスナー設定
function setupEventListeners() {
    // ソート
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-column');
            sortTable(column);
        });
    });
    
    // チャートメトリクス変更
    document.getElementById('chartMetric').addEventListener('change', updateChart);
    
    // ESCキーで詳細パネルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetail();
        }
    });
    
    // 詳細パネル外クリックで閉じる
    document.getElementById('detailPanel').addEventListener('click', (e) => {
        if (e.target.id === 'detailPanel') {
            closeDetail();
        }
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 沖縄本島防災計画比較システム 初期化開始');
    
    await loadEvacuationData();
    setupSearch();
    setupEventListeners();
    
    // デフォルトで全て表示
    document.querySelector('[data-hazard="all"]').classList.add('active');
    
    console.log('✅ システム初期化完了');
});