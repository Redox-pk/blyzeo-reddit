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
      const allComments = res.data[1].data.children.map(c => ({
        author: c.data.author,
        body: c.data.body,
        profile_url: `https://www.reddit.com/user/${c.data.author}`,
        other1: `Upvotes: ${c.data.ups}`,
        other2: `Posted: ${new Date(c.data.created_utc * 1000).toLocaleString()}`
      }));

      setComments(allComments);
      document.getElementById('downloads').style.display = 'block';
    } catch (err) {
      setError('Error fetching Reddit data.');
    }
  }

  // Download CSV
  window.downloadCSV = function() {
    const headers = ["Profile Name", "Comment", "Profile with Link", "Profile URL", "Other Detail 1", "Other Detail 2"];
    const rows = comments.map(c => [
      c.author,
      c.body,
      `=HYPERLINK("${c.profile_url}", "${c.author}")`,
      c.profile_url,
      c.other1,
      c.other2
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(i => `"${i}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reddit_comments.csv";
    link.click();
  };

  // Download Excel
  window.downloadExcel = function() {
    const ws = XLSX.utils.json_to_sheet(comments.map(c => ({
      "Profile Name": c.author,
      "Comment": c.body,
      "Profile with Link": c.profile_url,
      "Profile URL": c.profile_url,
      "Other Detail 1": c.other1,
      "Other Detail 2": c.other2
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comments");
    XLSX.writeFile(wb, "reddit_comments.xlsx");
  };

  // Download PDF
  window.downloadPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Reddit Comments Export", 10, 10);
    let y = 20;

    comments.forEach((c, i) => {
      doc.text(`${i + 1}. ${c.author}`, 10, y);
      y += 6;
      doc.text(`Comment: ${c.body}`, 10, y);
      y += 6;
      doc.text(`Link: ${c.profile_url}`, 10, y);
      y += 6;
      doc.text(`${c.other1}, ${c.other2}`, 10, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("reddit_comments.pdf");
  };

  return e('div', null,
    e('h2', null, '🔍 Blayzeo v3.9 – Reddit Tool'),
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
