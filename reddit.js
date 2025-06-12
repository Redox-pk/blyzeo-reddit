const e = React.createElement;

function RedditFetcher() {
  const [postUrl, setPostUrl] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [post, setPost] = React.useState(null);
  const [error, setError] = React.useState('');

  async function fetchData() {
    try {
      const parts = postUrl.split('/');
      const postId = parts[parts.findIndex(p => p === 'comments') + 1];
      const subreddit = parts[parts.findIndex(p => p === 'r') + 1];
      const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;

      const res = await axios.get(url);
      setPost(res.data[0].data.children[0].data);
      setComments(res.data[1].data.children.map(c => c.data));
    } catch (err) {
      setError('Error fetching Reddit data.');
    }
  }

  return e('div', null,
    e('h2', null, '🔍 Blayzeo Reddit Tool'),
    e('input', {
      placeholder: 'Paste Reddit post URL',
      value: postUrl,
      onChange: (e) => setPostUrl(e.target.value)
    }),
    e('button', { onClick: fetchData }, 'Fetch Post & Comments'),
    error && e('p', { style: { color: 'red' } }, error),
    post && e('div', null,
      e('h3', null, post.title),
      e('p', null, post.selftext || '[No Content]')
    ),
    comments.map((c, i) =>
      e('div', { key: i, className: 'comment' },
        e('strong', null, c.author),
        e('p', null, c.body)
      )
    )
  );
}

ReactDOM.render(e(RedditFetcher), document.getElementById('root'));