const e = React.createElement;

function RedditFetcher() {
  const [postUrl, setPostUrl] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [post, setPost] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [messageSubject, setMessageSubject] = React.useState('');
  const [messageBody, setMessageBody] = React.useState('');
  const [keywordFilter, setKeywordFilter] = React.useState('');

  async function fetchData() {
    try {
      setLoading(true);
      const parts = postUrl.split('/');
      const postId = parts[parts.findIndex(p => p === 'comments') + 1];
      const subreddit = parts[parts.findIndex(p => p === 'r') + 1];
      const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=500`;

      const res = await axios.get(url);
      setPost(res.data[0].data.children[0].data);
      setComments(res.data[1].data.children.map(c => c.data));
      setError('');
    } catch (err) {
      setError('Error fetching Reddit data.');
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const header = ['Author', 'Comment', 'Profile Link'];
    const rows = comments.map(c => [
      c.author,
      `"${c.body.replace(/"/g, '""')}"`,
      `https://www.reddit.com/user/${c.author}`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'reddit_comments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredComments = keywordFilter
    ? comments.filter(c => c.body.toLowerCase().includes(keywordFilter.toLowerCase()))
    : comments;

  return e('div', null,
    e('h2', null, '🔍 Blayzeo Reddit Tool'),
    e('input', {
      placeholder: 'Paste Reddit post URL',
      value: postUrl,
      onChange: e => setPostUrl(e.target.value)
    }),
    e('button', { onClick: fetchData }, 'Fetch Post & Comments'),

    e('div', { id: 'loader', className: loading ? '' : 'hidden' },
      e('div', { className: 'loader-circle' })
    ),

    error && e('p', { style: { color: 'red' } }, error),

    post && e('div', { id: 'postContent' },
      e('h3', null, post.title),
      e('p', null, post.selftext || '[No Content]')
    ),

    comments.length > 0 && e('div', null,
      e('input', {
        placeholder: 'Filter comments by keyword...',
        value: keywordFilter,
        onChange: e => setKeywordFilter(e.target.value)
      }),
      e('button', { onClick: exportToCSV }, '📁 Export to CSV')
    ),

    e('div', { id: 'messageForm' },
      e('h3', null, '📨 Prepare Message'),
      e('input', {
        type: 'text',
        placeholder: 'Subject (optional)',
        value: messageSubject,
        onChange: e => setMessageSubject(e.target.value)
      }),
      e('textarea', {
        placeholder: 'Message body (optional)',
        value: messageBody,
        onChange: e => setMessageBody(e.target.value)
      })
    ),

    filteredComments.map((c, i) =>
      e('div', { key: i, className: 'comment' },
        e('strong', null, c.author),
        e('p', null, c.body),
        e('a', {
          href: `https://www.reddit.com/user/${c.author}`,
          target: '_blank'
        }, '👤 View Profile'),
        (messageSubject || messageBody) && e('a', {
          className: 'message-btn',
          href: `https://www.reddit.com/message/compose/?to=${c.author}&subject=${encodeURIComponent(messageSubject)}&message=${encodeURIComponent(messageBody)}`,
          target: '_blank'
        }, 'Send Message')
      )
    )
  );
}

ReactDOM.render(e(RedditFetcher), document.getElementById('root'));
