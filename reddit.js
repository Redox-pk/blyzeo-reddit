const e = React.createElement;

let allComments = [];

async function fetchData() {
  toggleLoader(true);
  const postUrl = document.getElementById("postUrl").value;
  const postContentDiv = document.getElementById("postContent");
  postContentDiv.innerHTML = "";

  try {
    const parts = postUrl.split('/');
    const postId = parts[parts.findIndex(p => p === 'comments') + 1];
    const subreddit = parts[parts.findIndex(p => p === 'r') + 1];
    const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;

    const res = await axios.get(url);
    const post = res.data[0].data.children[0].data;
    allComments = res.data[1].data.children
      .filter(c => c.kind === 't1')
      .map(c => c.data);

    renderPost(post);
    renderComments(allComments);
    extractEmails(allComments);
  } catch (err) {
    postContentDiv.innerHTML = `<p style="color:red">Error fetching Reddit data.</p>`;
  }
  toggleLoader(false);
}

function renderPost(post) {
  const div = document.getElementById("postContent");
  div.innerHTML = `
    <h3>${post.title}</h3>
    <p>${post.selftext || '[No content]'}</p>
  `;
}

function renderComments(comments) {
  const div = document.getElementById("postContent");

  comments.forEach((c, i) => {
    const messageSubject = document.getElementById("messageSubject").value;
    const messageBody = document.getElementById("messageBody").value;
    const encodedMessage = encodeURIComponent(`${messageSubject ? messageSubject + '\n' : ''}${messageBody}`);

    const msgLink = `https://www.reddit.com/message/compose/?to=${c.author}&message=${encodedMessage}`;

    const commentHtml = `
      <div class="comment">
        <strong>${c.author}</strong>
        <p>${c.body}</p>
        <a href="https://www.reddit.com/user/${c.author}" target="_blank">🔗 Profile</a>
        ${messageBody.trim() || messageSubject.trim() ? `<a href="${msgLink}" target="_blank">💬 Send Message</a>` : ''}
      </div>
    `;
    div.innerHTML += commentHtml;
  });
}

function applyKeywordFilter() {
  const keyword = document.getElementById("keywordFilter").value.toLowerCase();
  const filtered = allComments.filter(c => c.body.toLowerCase().includes(keyword));
  document.getElementById("postContent").innerHTML = '';
  renderComments(filtered);
  extractEmails(filtered);
}

function extractEmails(comments) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const emailList = [];

  comments.forEach(c => {
    const matches = c.body.match(emailRegex);
    if (matches) {
      matches.forEach(email => {
        if (!emailList.includes(email)) {
          emailList.push(email);
        }
      });
    }
  });

  const emailUL = document.getElementById("emails");
  emailUL.innerHTML = '';
  emailList.forEach(email => {
    const li = document.createElement("li");
    li.textContent = email;
    emailUL.appendChild(li);
  });
}

function toggleMessageLinks() {
  document.getElementById("postContent").innerHTML = '';
  renderComments(allComments);
}

function exportToCSV() {
  const headers = ["Author", "Comment", "Profile Link"];
  const rows = allComments.map(c => [
    c.author,
    `"${c.body.replace(/"/g, '""')}"`,
    `https://www.reddit.com/user/${c.author}`
  ]);

  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + rows.map(r => r.join(",")).join("\n");

  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "reddit_comments.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function toggleLoader(show) {
  const loader = document.getElementById("loader");
  loader.className = show ? '' : 'hidden';
}
