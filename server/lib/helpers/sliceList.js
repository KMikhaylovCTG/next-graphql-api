const sliceList = (items, {from, limit}) => {
	items = items || [];
	items = (from ? items.slice(from) : items);
	items = (limit ? items.slice(0, limit) : items);

	return items;
};

export default sliceList;
