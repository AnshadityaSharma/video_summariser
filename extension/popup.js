document.getElementById('conceptInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch(document.getElementById('conceptInput').value);
});
document.getElementById('searchBtn').addEventListener('click', () => {
  handleSearch(document.getElementById('conceptInput').value);
});

async function handleSearch(concept) {
  if (!concept) return;
  document.getElementById('conceptInput').value = concept;

  const resultsDiv = document.getElementById('results');
  const loadingDiv = document.getElementById('loading');
  resultsDiv.innerHTML = '';
  loadingDiv.style.display = 'block';

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url.includes('youtube.com/watch')) {
      loadingDiv.style.display = 'none';
      resultsDiv.innerHTML = '<p class="err">Open a YouTube video first.</p>';
      return;
    }

    try {
      const resp = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: tab.url, concept }),
      });
      const data = await resp.json();
      loadingDiv.style.display = 'none';

      if (!resp.ok) {
        resultsDiv.innerHTML = `<p class="err">${data.detail}</p>`;
        return;
      }

      // meta pills
      const meta = document.createElement('div');
      meta.className = 'meta-row';
      meta.innerHTML =
        '<span class="ml">Searched:</span>' +
        data.expanded_concepts.map((k) => `<span class="mpill">${k}</span>`).join('');
      resultsDiv.appendChild(meta);

      if (data.results.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.innerHTML = `<p class="empty-msg">No matches for "<b>${concept}</b>".</p>`;

        if (data.suggested_topics && data.suggested_topics.length > 0) {
          let html = '<div class="sugg-title">Related topics in this video</div>';
          data.suggested_topics.forEach((t) => {
            html += `<span class="chip" data-topic="${t}">${t}</span>`;
          });
          emptyEl.innerHTML += html;
        }
        resultsDiv.appendChild(emptyEl);

        // attach click handlers for chips
        emptyEl.querySelectorAll('.chip').forEach((el) => {
          el.addEventListener('click', () => handleSearch(el.dataset.topic));
        });
        return;
      }

      data.results.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'clip';

        let hl = r.text;
        r.matched_concepts.forEach((kw) => {
          if (kw.length > 2) {
            const re = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            hl = hl.replace(re, '<span class="hl">$1</span>');
          }
        });

        card.innerHTML = `
          <div class="clip-top">
            <span class="clip-range">${r.formatted_time}</span>
            <button class="goto-btn">▶ Go to Clip</button>
          </div>
          <div class="clip-body">${hl}</div>
        `;

        card.querySelector('.goto-btn').addEventListener('click', () => {
          chrome.tabs.sendMessage(tab.id, { action: 'jump', time: r.timestamp });
        });

        resultsDiv.appendChild(card);
      });
    } catch {
      loadingDiv.style.display = 'none';
      resultsDiv.innerHTML = '<p class="err">Cannot reach the backend on localhost:8000.</p>';
    }
  });
}
