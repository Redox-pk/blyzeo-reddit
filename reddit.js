const postUrlInput = document.getElementById("postUrl");
const postContent = document.getElementById("postContent");
const commentsContainer = document.getElementById("comments");
const loader = document.getElementById("loader");

async function fetchData() {
  const url = postUrlInput.value.trim();
  if (!url) return alert("Please enter a Reddit post URL.");

  showLoader(true);
  try {
    const parts = url.split("/");
    const postId = parts[parts.findIndex(p => p === "comments") + 1];
    const subreddit = parts[parts.findIndex(p => p === "r") + 1];
    const apiUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=500`;

    const res = await axios.get(apiUrl);
    const post = res.data[0].data.children[0].data;
    const comments = res.data[1].data.children.map(c => c.data);

    renderPost(post);
    renderComments(comments);
  } catch (err) {
    alert("Failed to fetch post or comments.");
    console.error(err);
  }
  showLoader(false);
}

function renderPost(post) {
  postContent.innerHTML = `
    <h3>${post.title}</h3>
    <p>${post.selftext || "[No Content]"}</p>
    <p><strong>Author:</strong> <a href="https://www.reddit.com/user/${post.author}" target="_blank">${post.author}</a></p>
  `;
}

function renderComments(comments) {
  const uniqueAuthors = new Set();
  commentsContainer.innerHTML = "";

  comments.forEach((c) => {
    if (c.author && !uniqueAuthors.has(c.author)) {
      uniqueAuthors.add(c.author);

      const authorLink = `https://www.reddit.com/user/${c.author}`;
      const messageButton = document.getElementById("messageBody").value
        ? `<a class="message-btn" href="${generateMessageLink(c.author)}" target="_blank">💬 Message</a>`
        : "";

      commentsContainer.innerHTML += `
        <div class="comment">
          <strong><a href="${authorLink}" target="_blank">${c.author}</a></strong>
          <p>${c.body}</p>
          ${messageButton}
        </div>
      `;
    }
  });
}

function generateMessageLink(username) {
  const subject = encodeURIComponent(document.getElementById("messageSubject").value);
  const body = encodeURIComponent(document.getElementById("messageBody").value);
  return `https://www.reddit.com/message/compose/?to=${username}&subject=${subject}&message=${body}`;
}

function prepareMessages() {
  renderCommentsFromExisting();
}

function renderCommentsFromExisting() {
  const allComments = document.querySelectorAll(".comment");
  const subject = document.getElementById("messageSubject").value;
  const body = document.getElementById("messageBody").value;

  allComments.forEach((div) => {
    const authorLink = div.querySelector("a");
    const username = authorLink.textContent;
    const messageLink = generateMessageLink(username);

    // If already exists, skip
    if (!div.querySelector(".message-btn") && subject && body) {
      const btn = document.createElement("a");
      btn.href = messageLink;
      btn.textContent = "💬 Message";
      btn.className = "message-btn";
      btn.target = "_blank";
      div.appendChild(btn);
    }
  });
}

function showLoader(show) {
  loader.classList.toggle("hidden", !show);
}
