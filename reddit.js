const e = React.createElement;

function RedditFetcher() {
  const [postUrl, setPostUrl] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const [post, setPost] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [keyword, setKeyword] = React.useState('');
  const [emailList, setEmailList] = React.useState([]);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');

  async function fetchData() {
    setLoading(true);
    setError('');
    setComments([]);
    setPost(null);
    try {
      const parts = postUrl.split('/');
      const postId = parts[parts.findIndex(p => p === 'comments') + 1];
      const subreddit = parts[parts.findIndex(p => p === 'r') + 1];
      const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=500`;

      const res = await axios.get(url);
      const postData = res.data[0].data.children[0].data;
      const commentData = res.data[1].data.children
        .map(c => c.data)
        .filter(c => c.body);

      setPost(postData);
      setComments(commentData);

      // Email extractor
      const emails = commentData
        .map(c => c.body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi))
        .flat()
        .filter(Boolean);

      const uniqueEmails = [...new Set(emails)];
      setEmailList(uniqueEmails);
    } catch (err) {
      setError('Error fetching Reddit data.');
    }
    setLoading(false);
  }

  function exportToCSV() {
    let csv = "Author,Profile Link,Comment\n";
    comments.forEach(c => {
      const link = `https://www.reddit.com/user/${c.author}`;
      const cleanComment = c.body.replace(/\n/g, " ").replace(/,/g, " ");
      csv += `"${c.author}","${link}","${cleanComment}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'reddit_comments.csv');
    link.click();
  }

  function filterComments(comments) {
    if (!keyword.trim()) return comments;
    return comments.filter(c => c.body.toLowerCase().includes(keyword.toLowerCase()));
  }

  return e('div', null,
    e('h2', null, '🚀 Blayzeo Reddit Tool'),

    e('input', {
      placeholder: 'Paste Reddit post URL...',
      value: postUrl,
      onChange: e => setPostUrl(e.target.value)
    }),

    e('div', { id: 'controls' },
      e('button', { onClick: fetchData }, 'Fetch Post & Comments'),
      e('button', { onClick: exportToCSV }, '⬇ Export to CSV')
    ),

    loading && e('div', { id: 'loader' }, e('div', { className: 'loader-spinner' })),
    error && e('p', { style: { color: 'red' } }, error),

    post && e('div', null,
      e('h3', null, post.title),
      e('p', null, post.selftext || '[No Content]')
    ),

    e('input', {
      placeholder: '🔍 Filter by keyword (optional)',
      value: keyword,
      onChange: e => setKeyword(e.target.value)
    }),

    e('textarea', {
      placeholder: 'Message subject (optional)',
      value: subject,
      onChange: e => setSubject(e.target.value)
    }),

    e('textarea', {
      placeholder: 'Message body (optional)',
      value: body,
      onChange: e => setBody(e.target.value)
    }),

    filterComments(comments).map((c, i) =>
      e('div', { key: i, className: 'comment' },
        e('strong', null, c.author),
        e('p', null, c.body),
        (subject && body) && e('a', {
          href: `https://www.reddit.com/message/compose/?to=${c.author}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(body)}`,
          target: '_blank'
        }, '📨 Send Message')
      )
    ),

    emailList.length > 0 && e('div', null,
      e('h3', null, '📧 Emails Found'),
      e('ul', { id: 'emails' },
        emailList.map((email, i) => e('li', { key: i }, email))
      )
    )
  );
}

ReactDOM.render(e(RedditFetcher), document.getElementById('root'));
