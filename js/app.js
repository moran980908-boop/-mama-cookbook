// ============================================================
// 孕妇菜谱 - 主应用逻辑
// ============================================================

let currentCategory = 'all';
let currentKeyword = '';
let currentPage = window.location.hash.replace('#', '') || 'home';

// ==================== DOM 引用 ====================
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const mainContent = $('mainContent');
const detailPage = $('detailPage');
const searchInput = $('searchInput');
const catBtns = $$('.cat-btn');

// ==================== 知识面板折叠 ====================
function toggleKnowledge() {
  const body = $('knowledgeBody');
  const icon = $('toggleIcon');
  body.classList.toggle('open');
  icon.classList.toggle('collapsed');
}

// ==================== 图片扩展名列表 ====================
const IMG_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

// ==================== 渲染菜谱卡片 ====================
function createRecipeCard(recipe) {
  const dir = recipe.category === '荤菜' ? 'meat' : recipe.category === '汤' ? 'soup' : 'veg';
  const base = `images/${dir}/${recipe.id}/main`;

  const imgHtml = `
    <div class="card-img-container">
      <img class="card-img" src="${base}.jpg" alt="${recipe.name}"
        onerror="
          var img=this;
          var exts=['.jpeg','.png','.webp'];
          var base=img.src.substring(0,img.src.lastIndexOf('.'));
          var tryNext=function(i){
            if(i>=exts.length){
              img.style.display='none';
              var ph=img.parentElement.querySelector('.card-img-placeholder');
              if(ph)ph.style.display='flex';
              return;
            }
            img.src=base+exts[i];
            img.onerror=function(){tryNext(i+1);};
          };
          tryNext(0);
        "
      >
      <div class="card-img-placeholder">${recipe.icon}</div>
    </div>
  `;

  return `
    <div class="recipe-card" onclick="openDetail('${recipe.id}')">
      ${imgHtml}
      <div class="card-body">
        <h3>${recipe.name}</h3>
        <div class="card-tags">
          ${recipe.tags.map((tag, i) =>
            tag ? `<span class="card-tag ${recipe.tagTypes[i] || ''}">${tag}</span>` : ''
          ).join('')}
        </div>
      </div>
    </div>
  `;
}

// ==================== 渲染分类标题 ====================
function renderSectionTitle(title, icon) {
  return `
    <div class="section-title">
      <span>${icon}</span>
      <span>${title}</span>
      <div class="title-line"></div>
    </div>
  `;
}

// ==================== 按分类渲染 ====================
function renderMeat() {
  let html = `<div id="section-meat">${renderSectionTitle('荤菜', '🥩')}<div class="recipe-grid">`;
  recipes.meat.forEach(r => { html += createRecipeCard(r); });
  html += '</div></div>';
  return html;
}

function renderVegetable() {
  let html = `<div id="section-veg">${renderSectionTitle('素菜', '🥬')}<div class="recipe-grid">`;
  recipes.vegetable.forEach(r => { html += createRecipeCard(r); });
  html += '</div></div>';
  return html;
}

function renderSoup() {
  let html = `<div id="section-soup">${renderSectionTitle('汤类', '🍲')}<div class="recipe-grid">`;
  recipes.soup.forEach(r => { html += createRecipeCard(r); });
  html += '</div></div>';
  return html;
}

// ==================== 渲染首页 ====================
function renderHome() {
  const welcomeHtml = `
    <div class="welcome-section">
      <h2>👶 孕期营养厨房</h2>
      <p>精选孕妇安全菜谱 · 荤素搭配 · 营养均衡<br>
      所有菜品均不含孕妇禁忌食材，请放心食用</p>
    </div>
  `;

  let html = welcomeHtml;
  html += renderMeat();
  html += renderVegetable();
  html += renderSoup();
  html += `
    <div class="footer-info">
      孕期饮食温馨提示：均衡营养、少食多餐<br>
      如有特殊情况，请咨询您的产科医生
    </div>
  `;
  mainContent.innerHTML = html;
}

// ==================== 按分类渲染 ====================
function renderByCategory(category) {
  if (category === 'all') {
    renderHome();
    return;
  }

  let html = '';

  if (category === 'meat') {
    html += renderMeat();
  } else if (category === 'vegetable') {
    html += renderVegetable();
  } else if (category === 'soup') {
    html += renderSoup();
  }

  if (!html) {
    html = '<div class="empty-state"><div class="empty-icon">🍳</div><p>暂无菜谱</p></div>';
  }

  mainContent.innerHTML = html;
}

// ==================== 渲染搜索结果 ====================
function renderSearchResults(keyword) {
  const results = searchRecipes(keyword);
  if (!results || results.length === 0) {
    mainContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>没有找到匹配"${keyword}"的菜谱</p>
        <p style="margin-top:8px;font-size:13px;">试试搜索：鸡、牛肉、豆腐、菠菜、汤...</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="section-title">
      <span>🔍</span>
      <span>搜索"${keyword}"的结果（${results.length}个）</span>
      <div class="title-line"></div>
    </div>
    <div class="recipe-grid">
  `;
  results.forEach(r => { html += createRecipeCard(r); });
  html += '</div>';
  mainContent.innerHTML = html;
}

/**
 * 获取分类名称对应的目录名
 */
function getCategoryDir(category) {
  if (category === '荤菜') return 'meat';
  if (category === '素菜') return 'veg';
  if (category === '汤') return 'soup';
  return 'meat';
}

// ==================== 详情页面 ====================
function openDetail(id) {
  const recipe = findRecipeById(id);
  if (!recipe) {
    showToast('菜谱未找到');
    return;
  }

  const categoryDir = getCategoryDir(recipe.category);

  // 构建详情页主图
  const icon = recipe.icon || '🍳';
  const base = `images/${categoryDir}/${recipe.id}/main`;

  const detailHeaderImg = `
    <img class="detail-header-img" src="${base}.jpg" alt="${recipe.name}"
      onerror="
        var img=this;
        var exts=['.jpeg','.png','.webp'];
        var base=img.src.substring(0,img.src.lastIndexOf('.'));
        var tryNext=function(i){
          if(i>=exts.length){
            img.style.display='none';
            var ph=img.parentElement.querySelector('.detail-header-placeholder');
            if(ph)ph.style.display='flex';
            return;
          }
          img.src=base+exts[i];
          img.onerror=function(){tryNext(i+1);};
        };
        tryNext(0);
      "
    >
    <div class="detail-header-placeholder" style="display:none;">${icon}</div>
  `;

  // 构建步骤HTML（带步骤图）
  const stepsHtml = recipe.steps.map((step, i) => {
    const sn = i + 1;
    const stepImgBase = `images/${categoryDir}/${recipe.id}/step${sn}`;
    const stepImgSrc = `${stepImgBase}_1.jpg`;
    
    // onerror链：先尝试step1_1.jpg -> step1_1.jpeg -> step1_1.png -> 然后尝试step1_1.jpg (如果之前没扩展名)
    const onerror = `
      var img=this;
      var base='images/${categoryDir}/${recipe.id}/step${sn}';
      var tries=['_1.jpg','_1.jpeg','_1.png','_1.webp','_2.jpg','_2.jpeg','_2.png','_2.webp'];
      var idx=0;
      var tryNext=function(){
        if(idx>=tries.length){
          img.style.display='none';
          var ph=img.parentElement.querySelector('.step-img-placeholder');
          if(ph)ph.style.display='flex';
          return;
        }
        img.src=base+tries[idx];
        idx++;
        img.onerror=tryNext;
      };
      tryNext();
    `;

    return `
      <div class="step-item">
        <div class="step-number">${sn}</div>
        <div class="step-content">
          <p>${step.text}</p>
          <img class="step-img" src="${stepImgSrc}"
            alt="步骤${sn}"
            onerror="(function(){${onerror}})();"
          >
          <div class="step-img-placeholder" style="display:none;">📸 步骤${sn}示意图</div>
        </div>
      </div>
    `;
  }).join('');

  let html = `
    <div class="detail-header">
      <button class="detail-back" onclick="closeDetail()">✕</button>
      ${detailHeaderImg}
      <h2>${recipe.name}</h2>
      <div class="detail-sub">
        ${recipe.tags.filter(Boolean).join(' · ')} 
        <span style="margin-left:8px;">分类：${recipe.category}</span>
      </div>
    </div>
    <div class="detail-body">

      <div class="nutrition-tip">
        <strong>🥗 营养功效</strong><br>
        ${recipe.nutrition}
      </div>

      <div class="ingredients-section">
        <h3>📋 食材准备</h3>
        <div class="ingredient-list">
          ${recipe.ingredients.map(i => `<span class="ingredient-item">${i}</span>`).join('')}
        </div>
      </div>

      <div class="ingredients-section">
        <h3>🧂 调料</h3>
        <div class="seasoning-list">
          ${recipe.seasonings.map(s => `<span class="seasoning-item">${s}</span>`).join('')}
        </div>
      </div>

      <div class="steps-section">
        <h3>👩‍🍳 烹饪步骤</h3>
        ${stepsHtml}
      </div>

      <div class="warning-box">
        <strong>⚠️ 注意事项</strong><br>
        ${recipe.warnings}
      </div>
    </div>
  `;

  detailPage.innerHTML = html;
  detailPage.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  detailPage.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { detailPage.innerHTML = ''; }, 400);
}

// ==================== 分类切换 ====================
function switchCategory(category) {
  currentCategory = category;
  currentKeyword = '';

  catBtns.forEach(btn => {
    const cat = btn.dataset.category;
    btn.classList.toggle('active', cat === category);
  });

  searchInput.value = '';
  renderByCategory(category);
  window.location.hash = category === 'all' ? '' : category;
}

// ==================== 搜索处理 ====================
function handleSearch() {
  const keyword = searchInput.value.trim();
  if (!keyword) {
    switchCategory(currentCategory);
    return;
  }
  currentKeyword = keyword;
  renderSearchResults(keyword);
}

// ==================== Toast提示 ====================
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ==================== 初始化 ====================
function init() {
  const hash = window.location.hash.replace('#', '');
  if (hash && ['meat', 'vegetable', 'soup'].includes(hash)) {
    currentCategory = hash;
    catBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === hash);
    });
    renderByCategory(hash);
  } else {
    renderHome();
  }
}

// ==================== 事件绑定 ====================
document.addEventListener('DOMContentLoaded', init);

let searchTimer;
searchInput.addEventListener('input', function() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(handleSearch, 300);
});

searchInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    clearTimeout(searchTimer);
    handleSearch();
  }
});
