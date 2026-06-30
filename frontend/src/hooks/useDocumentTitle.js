import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | Restaurant` : 'Restaurant';
  }, [title]);
};

export default useDocumentTitle;
