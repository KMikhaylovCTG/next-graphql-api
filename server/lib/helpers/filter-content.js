import sliceList from '../helpers/slice-list';
import articleGenres from 'ft-next-article-genre';
import capifyMetadata from '../helpers/capify-metadata';

// internal content filtering logic shared for ContentV1 and ContentV2
export default ({from, limit, genres, type}, resolveType) => {
	return (items = []) => {

		if(!Array.isArray(items)) {
			return [items];
		}

		if (genres && genres.length) {
			items = items.filter(item => genres.indexOf(articleGenres(capifyMetadata(item.metadata), {requestedProp: 'editorialTone'})) > -1);
		}

		if (type) {
			if (type === 'liveblog') {
				items = items.filter(it => resolveType(it) === 'liveblog');
			} else if (type === 'video') {
				items = items.filter(it => resolveType(it) === 'video');
			} else if (type === 'article'){
				items = items.filter(it => resolveType(it) === 'article');
			}
		}
		return sliceList(items, {from, limit});
	};
};
