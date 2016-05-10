import playground from './playground';

window.onload = () => {
	if (window.location.pathname === '/playground') {
		const graphiql = document.getElementsByClassName('graphiql')[0];
		const apiKey = document.querySelector('.api-key').textContent;
		playground(graphiql, apiKey);
	}
}
