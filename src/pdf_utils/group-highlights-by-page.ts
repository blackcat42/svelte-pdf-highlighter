import type { GhostHighlight, Highlight } from "$lib/types";

type GroupedHighlights = {
  [pageNumber: number]: Array<Highlight | GhostHighlight>;
};

const groupHighlightsByPage = (
  highlights: Array<Highlight | GhostHighlight | null>,
): GroupedHighlights => {
  

  let res = {};
  highlights.map((highlight) => {
    if (!highlight) {
      return;
    }
    let pageNumbers = new Set();
     pageNumbers.add(highlight.position.boundingRect.pageNumber)
      highlight.position.rects.forEach((item) => {
      pageNumbers.add(item.pageNumber ? item.pageNumber : 0)
    });

      pageNumbers.forEach((pageNumber) => {
      res[pageNumber] ||= [];

      if (0) {
        res[pageNumber].push(highlight);
      }
      const pageSpecificHighlight = {
        ...highlight,
        position: {
          ...highlight.position,
          rects: highlight.position.rects.filter(
            (rect) => pageNumber === rect.pageNumber,
          ),
        },
      };
      //console.log(pageSpecificHighlight);
      res[pageNumber].push(pageSpecificHighlight);
    });
  });



  return res;

  return highlights.reduce<GroupedHighlights>((acc, highlight) => {
    if (!highlight) {
      return acc;
    }
    
    pageNumbers.add(highlight.position.boundingRect.pageNumber)
    highlight.position.rects.forEach((item) => {
      pageNumbers.add(item.pageNumber ? item.pageNumber : 0)
    });

    /*const pageNumbers = [
      //highlight.position.boundingRect.pageNumber,
      ...highlight.position.rects.map((rect) => rect.pageNumber || 0),
    ];*/
    //console.log(pageNumbers)
    pageNumbers.forEach((pageNumber) => {
      acc[pageNumber] ||= [];
      const pageSpecificHighlight = {
        ...highlight,
        position: {
          ...highlight.position,
          rects: highlight.position.rects.filter(
            (rect) => pageNumber === rect.pageNumber,
          ),
        },
      };
      //console.log(pageSpecificHighlight);
      acc[pageNumber].push(pageSpecificHighlight);
    });
    //console.log(acc);
    console.log(acc)
    return acc;
  }, {})

};

export default groupHighlightsByPage;
