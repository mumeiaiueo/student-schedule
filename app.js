<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#f5f7fb" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="予定管理" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <link rel="manifest" href="manifest.json" />
  <link rel="apple-touch-icon" href="icons/icon-192.png" />
  <link rel="stylesheet" href="style.css" />
  <title>学生予定管理</title>
</head>
<body>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>

  <div class="app">
    <header class="topbar">
      <button id="menuBtn" class="menu-button" type="button" aria-label="メニューを開く">☰</button>
      <div class="topbar-title">
        <p class="eyebrow">Student Planner</p>
        <h1>予定管理</h1>
      </div>
      <button id="installBtn" class="pill hidden" type="button">追加</button>
    </header>

    <div id="drawerOverlay" class="drawer-overlay" hidden></div>
    <aside id="drawer" class="drawer" aria-hidden="true">
      <div class="drawer-header">
        <div>
          <p class="eyebrow">Menu</p>
          <h2>予定管理</h2>
        </div>
        <button id="closeDrawerBtn" class="circle" type="button" aria-label="メニューを閉じる">×</button>
      </div>
      <nav class="drawer-nav" aria-label="メニュー">
        <button class="drawer-link active" data-tab="home" type="button">ホーム</button>
        <button class="drawer-link" data-tab="add" type="button">追加</button>
        <button class="drawer-link" data-tab="tasks" type="button">課題一覧</button>
        <button class="drawer-link" data-tab="search" type="button">検索</button>
        <button class="drawer-link" data-tab="calendar" type="button">カレンダー</button>
        <button class="drawer-link" data-tab="timetable" type="button">時間割</button>
        <button class="drawer-link" data-tab="settings" type="button">設定</button>
      </nav>
    </aside>

    <main>
      <section id="view-home" class="view active">
        <div class="section-title">
          <h2>ホーム</h2>
          <button id="notifyBtnHome" class="text-button" type="button">通知登録</button>
        </div>

        <article class="hero-card">
          <p class="muted">今日</p>
          <h3 id="todayLabel">今日の予定</h3>
          <p id="homeSummary" class="summary">読み込み中...</p>
        </article>

        <section class="card">
          <div class="row-title">
            <h3>今日の予定</h3>
            <button class="text-button" data-open-tab="add" type="button">＋追加</button>
          </div>
          <div id="todayList" class="list"></div>
        </section>

        <section class="card">
          <div class="row-title">
            <h3>やばい順</h3>
            <span class="mini-label">課題優先</span>
          </div>
          <div id="dangerList" class="list"></div>
        </section>

        <section class="card">
          <div class="row-title">
            <h3>締切近い課題</h3>
            <span class="mini-label">未完了のみ</span>
          </div>
          <div id="upcomingTasks" class="list"></div>
        </section>

        <section class="card">
          <div class="row-title">
            <h3>今後7日間</h3>
            <span class="mini-label">今日を含む</span>
          </div>
          <div id="weekList" class="week-list"></div>
        </section>
      </section>

      <section id="view-add" class="view">
        <div class="section-title">
          <h2 id="formTitle">追加</h2>
          <button id="cancelEditBtn" class="text-button hidden" type="button">編集やめる</button>
        </div>

        <form id="scheduleForm" class="card form">
          <input id="editingId" name="editingId" type="hidden" />

          <label>
            タイトル
            <input id="title" name="title" type="text" placeholder="例：簿記の課題 / バイト / 友達と予定" autocomplete="off" required />
          </label>

          <label>
            種類
            <select id="type" name="type">
              <option value="task">課題</option>
              <option value="event">予定</option>
              <option value="class">授業</option>
              <option value="work">バイト</option>
              <option value="other">その他</option>
            </select>
          </label>

          <div class="two-col">
            <label>
              日付
              <input id="date" name="date" type="date" required />
            </label>
            <label>
              時刻
              <input id="time" name="time" type="time" required />
            </label>
          </div>

          <label>
            繰り返し
            <select id="repeatMode" name="repeatMode">
              <option value="none" selected>なし</option>
              <option value="weekly4">毎週（4回）</option>
              <option value="weekly12">毎週（12回）</option>
              <option value="monthly3">毎月（3回）</option>
            </select>
          </label>

          <label>
            通知
            <select id="notifyMode" name="notifyMode">
              <option value="strong">しつこめ</option>
              <option value="on" selected>通知あり</option>
              <option value="none">通知なし</option>
            </select>
          </label>

          <div id="notifyHint" class="hint"></div>

          <label>
            メモ
            <textarea id="memo" name="memo" rows="3" placeholder="場所、持ち物、提出URLなど"></textarea>
          </label>

          <button id="submitBtn" class="primary" type="submit">追加する</button>
        </form>
      </section>

      <section id="view-tasks" class="view">
        <div class="section-title">
          <h2>課題一覧</h2>
          <button class="text-button" data-open-tab="add" type="button">＋課題追加</button>
        </div>

        <section class="card">
          <div class="row-title">
            <h3>期限切れ</h3>
            <span class="mini-label">最優先</span>
          </div>
          <div id="overdueTasksList" class="list"></div>
        </section>

        <section class="card">
          <div class="row-title">
            <h3>今週締切</h3>
            <span class="mini-label">今日を含む7日</span>
          </div>
          <div id="weekTasksList" class="list"></div>
        </section>

        <section class="card">
          <div class="row-title">
            <h3>未完了の課題</h3>
            <span class="mini-label">締切順</span>
          </div>
          <div id="allTasksList" class="list"></div>
        </section>

        <section class="card">
          <div class="row-title">
            <h3>完了済み</h3>
            <span class="mini-label">最近のもの</span>
          </div>
          <div id="doneTasksList" class="list"></div>
        </section>
      </section>

      <section id="view-search" class="view">
        <div class="section-title">
          <h2>検索</h2>
        </div>
        <section class="card">
          <label>
            予定を検索
            <input id="searchInput" type="search" placeholder="例：簿記、バイト、レポート" autocomplete="off" />
          </label>
        </section>
        <section class="card">
          <div class="row-title">
            <h3>検索結果</h3>
            <span id="searchCount" class="mini-label">0件</span>
          </div>
          <div id="searchResults" class="list"></div>
        </section>
      </section>

      <section id="view-calendar" class="view">
        <div class="section-title">
          <h2>カレンダー</h2>
          <div class="month-nav">
            <button id="prevMonth" class="circle" type="button">‹</button>
            <strong id="monthTitle"></strong>
            <button id="nextMonth" class="circle" type="button">›</button>
          </div>
        </div>
        <section class="card">
          <div class="weekdays"><span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span></div>
          <div id="calendarGrid" class="calendar"></div>
        </section>
        <section class="card">
          <h3 id="selectedDayTitle">選択日の予定</h3>
          <div id="selectedDayList" class="list"></div>
        </section>
      </section>

      <section id="view-timetable" class="view">
        <div class="section-title">
          <h2>時間割</h2>
          <button id="addTimetableBtn" class="text-button" type="button">今学期分を追加</button>
        </div>
        <section class="card">
          <p class="muted">必要な時だけ見るページ。ホームには出しすぎないようにしたよ。</p>
          <div id="timetableGrid" class="timetable"></div>
        </section>
      </section>

      <section id="view-settings" class="view">
        <div class="section-title">
          <h2>設定</h2>
        </div>
        <section class="card settings-list">
          <button id="notifyBtnSettings" class="setting-row" type="button">
            <span>通知を許可・完全通知を登録</span>
            <small>アプリを閉じても届くPush通知に登録</small>
          </button>
          <button id="syncPushBtn" class="setting-row" type="button">
            <span>予定データを同期</span>
            <small>通知サーバーに最新の予定を送る</small>
          </button>
          <div class="setting-row">
            <span>完全通知の状態</span>
            <small id="pushStatus">未確認</small>
          </div>
          <div class="setting-row setting-control">
            <span>朝のまとめ通知</span>
            <small>今日の予定と近い課題を朝にまとめて通知</small>
            <div class="setting-inline">
              <label class="switch-label">
                <input id="dailySummaryEnabled" type="checkbox" checked />
                オン
              </label>
              <input id="dailySummaryTime" type="time" value="08:00" />
            </div>
          </div>
          <button id="exportBtn" class="setting-row" type="button">
            <span>バックアップ</span>
            <small>予定データをJSONで保存</small>
          </button>
          <label class="setting-row import-row">
            <span>復元</span>
            <small>バックアップJSONから戻す</small>
            <input id="importFile" type="file" accept="application/json" />
          </label>
          <button id="clearAllBtn" class="setting-row danger" type="button">
            <span>全データ削除</span>
            <small>最初からやり直す</small>
          </button>
        </section>

        <section class="notice-card">
          <strong>通知について</strong>
          <p>この試作版はアプリを開いている間の通知チェックが中心です。iPhoneで完全なバックグラウンド通知までやるには、追加のサーバー実装が必要です。</p>
        </section>
      </section>
    </main>

  </div>

  <script src="app.js" defer></script>
</body>
</html>
