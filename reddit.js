const e = React.createElement;

function RedditFetcher() {
  const [postUrl, setPostUrl] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [post, setPost] = React.useState(null);
  const [error, setError] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [showMsgLinks, setShowMsgLinks] = React.useState(false);

  async function fetchData() {
    setError('');
    setPost(null);
    setComments([]);
    try {
      const parts = postUrl.split('/');
      const postId = parts[parts.findIndex(p => p === 'comments') + 1];
      const subreddit = parts[parts.findIndex(p => p === 'r') + 1];
      const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;

      const res = await axios.get(url);
      setPost(res.data[0].data.children[0].data);
      const allComments = res.data[1].data.children.map(c => c.data).filter(c => c.body);
      setComments(allComments);
    } catch (err) {
      setError('❌ Failed to fetch Reddit data.');
    }
  }

  function exportCSV() {
    const header = ['Author', 'Profile Link', 'Comment', 'Email'];
    const rows = comments.map(c => {
      const emailMatch = c.body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
      return [
        c.author,
        `https://www.reddit.com/user/${c.author}`,
        `"${c.body.replace(/"/g, '""')}"`,
        emailMatch ? emailMatch[0] : ''
      ];
    });

    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'blayzeo_reddit_export.csv';
    a.click();
  }

  const filteredComments = comments.filter(c =>
    c.body.toLowerCase().includes(filter.toLowerCase())
  );

  function getMessageLink(username) {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `https://www.reddit.com/message/compose/?to=${username}&subject=${encodedSubject}&message=${encodedBody}`;
  }

  return e('div', null,
    post && e('div', { className: 'post' },
      e('h2', null, `🧵 ${post.title}`),
      e('p', null, post.selftext || '[No Text]')
    ),

    e('div', { className: 'filters' },
      e('input', {
        type: 'text',
        placeholder: '🔍 Filter by keyword...',
        value: filter,
        onChange: (e) => setFilter(e.target.value)
      }),
      e('button', { onClick: exportCSV }, '⬇️ Export to CSV')
    ),

    e('div', { className: 'comment-section' },
      filteredComments.map((c, i) => {
        const emailMatch = c.body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
        const profileLink = `https://www.reddit.com/user/${c.author}`;
        return e('div', { key: i, className: 'comment' },
          e('div', { className: 'comment-header' },
            e('strong', null, c.author),
            e('a', { href: profileLink, target: '_blank' }, '🔗 Profile'),
            emailMatch && e('span', { className: 'email' }, `📧 ${emailMatch[0]}`)
          ),
          e('p', null, c.body),
          showMsgLinks && subject && body &&
            e('a', {
              className: 'send-msg-btn',
              href: getMessageLink(c.author),
              target: '_blank'
            }, '✉️ Send Message'),
          e('div', { className: 'share' },
            e('a', {
              href: `https://wa.me/?text=${encodeURIComponent(c.body)}`,
              target: '_blank'
            }, '📱 Share')
          )
        );
      })
    ),

    e('div', { style: { marginTop: '30px' } },
      e('p', null, `📬 Message Prefill Activated: ${showMsgLinks ? '✅' : '❌'}`)
    )
  );
}

function initReact() {
  ReactDOM.render(e(RedditFetcher), document.getElementById('root'));
}

// External handlers to connect with HTML inputs
document.getElementById('sendMessagesBtn').addEventListener('click', () => {
  const subject = document.getElementById('msgSubject').value;
  const body = document.getElementById('msgBody').value;
  window.subject = subject;
  window.body = body;
  initReact();
  setTimeout(() => {
    const event = new Event('input', { bubbles: true });
    document.getElementById('postUrl').dispatchEvent(event);
  }, 100);
});

window.fetchData = () => {
  window.subject = document.getElementById('msgSubject').value;
  window.body = document.getElementById('msgBody').value;
  initReact();
};

initReact();
