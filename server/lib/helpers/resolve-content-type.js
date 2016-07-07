export default value => /liveblog|marketslive|liveqa/i.test(value.webUrl) ? 'liveblog' : 'article';
