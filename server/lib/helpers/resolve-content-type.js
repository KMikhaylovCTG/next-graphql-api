export default content => {
	if (/liveblog|marketslive|liveqa/i.test(content.webUrl)) {
		return 'liveblog';
	} else if (/video/.test(content.webUrl)) {
		return 'video';
	} else {
		return 'article';
	}
};
