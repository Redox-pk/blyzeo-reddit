const e = React.createElement;

function RedditFetcher() {
  const [postUrl, setPostUrl] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [filteredComments, setFilteredComments] = React.useState([]);
  const [post, setPost] = React.useState(null);
  const [error, setError] = React.useState('');
  const [filter, setFilter] = React.useState('');

  async function fetchData() {
    try {
      setError('');
      const parts = postUrl.split('/');
      const postId = parts[parts.findIndex(p => p === 'comments') + 1];
      const subreddit = parts[parts.findIndex(p => p === 'r') + 1];
      const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=500`;

      const res = await axios.get(url);
      const allComments = res.data[1].data.children.map(c => c.data);
      setPost(res.data[0].data.children[0].data);
      setComments(allComments);
      setFilteredComments(allComments);
    } catch (err) {
      setError('⚠️ Error fetching Reddit data. Please check the link.');
    }
  }

  function exportCSV() {
    const headers = ['Author', 'Profile Link', 'Comment', 'Email Found'];
    const rows = filteredComments.map(c => {
      const emailMatch = c.body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
      return [
        c.author,
        `https://reddit.com/u/${c.author}`,
        c.body.replace(/\n/g, ' '),
        emailMatch ? emailMatch[0] : ''
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows]
      .map(e => e.map(val => `"${val}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "blayzeo_reddit_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function applyFilter(value) {
    setFilter(value);
    const filtered = comments.filter(c =>
      c.body.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredComments(filtered);
  }

  return e('div', null,
    e('div', { className: 'input-area' },
      e('input', {
        placeholder: 'Paste Reddit post URL',
        value: postUrl,
        onChange: (e) => setPostUrl(e.target.value)
      }),
      e('button', { onClick: fetchData }, '🔍 Fetch Post & Comments')
    ),

    error && e('p', { className: 'error' }, error),

    post && e('div', { className: 'post-box' },
      e('h2', null, post.title),
      e('p', null, post.selftext || '[No Content]'),
      e('input', {
        type: 'text',
        placeholder: 'Filter comments by keyword...',
        value: filter,
        onChange: (e) => applyFilter(e.target.value)
      }),
      e('button', { onClick: exportCSV }, '⬇ Export to Excel (.csv)')
    ),

    filteredComments.length > 0 && e('div', { className: 'comments-section' },
      filteredComments.map((c, i) =>
        e('div', { key: i, className: 'comment' },
          e('strong', null, c.author),
          e('a', {
            href: `https://reddit.com/u/${c.author}`,
            target: '_blank',
            rel: 'noopener noreferrer'
          }, ' 🔗 Profile'),
          e('p', null, c.body),
          c.body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/) &&
            e('p', { className: 'email' },
              '📧 ' + c.body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)[0]
            )
        )
      )
    )
  );
}

ReactDOM.render(e(RedditFetcher), document.getElementById('root'));
