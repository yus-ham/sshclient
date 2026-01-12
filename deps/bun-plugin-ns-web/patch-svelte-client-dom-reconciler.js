/** @param {string} html */
export function create_fragment_from_html(html) {
	const elem = document.createElement('template');
	elem.innerHTML = html
      .replaceAll('<frame>', '<div ns-frame>') // <Frame> often used as root in NS
      .replaceAll('</frame>', '</div>')
      .replaceAll('<!>', '<!---->'); // XHTML compliance
	return elem.content;
}
