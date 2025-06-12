const e = React.createElement;

function RedditFetcher() {
  const [postUrl, setPostUrl] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [post, setPost] = React.useState(null);
  const [error, setError] = React.useState('');
  const [filter, setFilter] = React.useState('');

  async function fetchData() {
    try {
      const parts = postUrl.split('/');
      const postId = parts[parts.findIndex(p => p === 'comments') + 1];
      const subreddit = parts[parts.findIndex(p => p === 'r') + 1];
      const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;

      const res = await axios.get(url);
      setPost(res.data[0].data.children[0].data);
      setComments(res.data[1].data.children.map(c => c.data));
      setError('');
    } catch (err) {
      console.error(err);
      setError('❌ Error fetching Reddit data. Please check the URL.');
    }
  }

  function exportToCSV() {
    const headers = ['Username', 'Profile URL', 'Comment', 'Score'];
    const rows = comments.map(c => [
      c.author,
      `https://www.reddit.com/user/${c.author}`,
      `"${c.body.replace(/\n/g, ' ').replace(/"/g, '""')}"`,
      c.score
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'reddit_comments.csv';
    a.click();
  }

  const filteredComments = comments.filter(c =>
    filter === '' || c.body.toLowerCase().includes(filter.toLowerCase())
  );

  return e('div', { className: 'container' },
    e('h2', null, '🔍 Blayzeo Reddit Tool v3.6'),
    e('input', {
      placeholder: 'Paste Reddit post URL',
      value: postUrl,
      onChange: (e) => setPostUrl(e.target.value),
      className: 'input'
    }),
    e('button', { onClick: fetchData, className: 'button' }, 'Fetch Post & Comments'),
    e('button', { onClick: exportToCSV, className: 'button' }, '⬇️ Export to CSV'),
    e('input', {
      placeholder: '🔍 Filter comments...',
      value: filter,
      onChange: (e) => setFilter(e.target.value),
      className: 'input'
    }),
    error && e('p', { style: { color: 'red' } }, error),
    post && e('div', { className: 'post' },
      e('h3', null, post.title),
      e('p', null, post.selftext || '[No Content]')
    ),
    e('div', { className: 'comments' },
      filteredComments.map((c, i) =>
        e('div', { key: i, className: 'comment' },
          e('strong', null,
            e('a', {
              href: `https://www.reddit.com/user/${c.author}`,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, c.author)
          ),
          e('p', null, c.body),
          e('span', { className: 'score' }, `⬆️ ${c.score}`)
        )
      )
    )
  );
}

ReactDOM.render(e(RedditFetcher), document.getElementById('root'));
