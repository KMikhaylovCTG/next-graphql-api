const convertMetadata = (metadata, taxonomy) => metadata
	.filter(metadata => metadata.taxonomy === taxonomy)
	.map(metadata => ({ term: { id: metadata.idV1 }}));

/**
	* Take ESv3 style metadata and convert it back to CAPI style
	*/
const capifyMetadata = metadata => {
	return {
	genre: convertMetadata(metadata, 'genre'),
	sections: convertMetadata(metadata, 'sections')
	}
};

export default capifyMetadata;
