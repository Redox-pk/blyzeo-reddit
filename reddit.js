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
      const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=500`;

      const res = await axios.get(url);
      setPost(res.data[0].data.children[0].data);
      const rawComments = res.data[1].data.children;

      const allComments = [];
      const extractAll = (items) => {
        items.forEach(item => {
          if (item.kind === 't1') {
            allComments.push(item.data);
            if (item.data.replies && item.data.replies.data) {
              extractAll(item.data.replies.data.children);
            }
          }
        });
      };

      extractAll(rawComments);
      setComments(allComments);
    } catch (err) {
      setError('Error fetching Reddit data.');
    }
  }

  return e('div', { className: 'container' },
    e('h2', null, '🔍 Blayzeo Reddit Tool v3.7'),
    e('input', {
      placeholder: 'Paste Reddit post URL',
      className: 'input',
      value: postUrl,
      onChange: (e) => setPostUrl(e.target.value)
    }),
    e('button', { onClick: fetchData, className: 'button' }, 'Fetch Post & Comments'),
    error && e('p', { style: { color: 'red' } }, error),
    post && e('div', { className: 'post' },
      e('h3', null, post.title),
      e('p', null, post.selftext || '[No Content]')
    ),
    e('div', { className: 'comments' },
      comments.map((c, i) =>
        e('div', { key: i, className: 'comment' },
          e('strong', null, c.author),
          e('a', {
            href: `https://www.reddit.com/user/${c.author}`,
            target: '_blank',
            rel: 'noopener noreferrer'
          }, ` 🔗 Profile`),
          e('p', null, c.body),
          e('span', { className: 'score' }, `⬆️ ${c.ups} upvotes`)
        )
      )
    )
  );
}

ReactDOM.render(e(RedditFetcher), document.getElementById('root'));
