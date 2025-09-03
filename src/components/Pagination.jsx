import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, indexOfFirstInvoice, indexOfLastInvoice, filteredInvoices }) => {
    const paginationWindow = 5;
    const startPage = Math.max(1, currentPage - Math.floor(paginationWindow / 2));
    const endPage = Math.min(totalPages, startPage + paginationWindow - 1);
    const pagesToShow = [];

    for (let i = startPage; i <= endPage; i++) {
        pagesToShow.push(i);
    }

    return (
        <nav className="flex items-center justify-between pt-4 flex-col md:flex-row" aria-label="Pagination Navigation">
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, filteredInvoices.length)}</span>
                {" "}of <span className="font-semibold text-gray-900 dark:text-white">{filteredInvoices.length}</span>
            </span>

            <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
                {/* Previous */}
                <li>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 h-8 flex items-center justify-center text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                    >
                        Previous
                    </button>
                </li>

                {/* Page numbers */}
                {pagesToShow.map((page) => (
                    <li key={page}>
                        <button
                            onClick={() => onPageChange(page)}
                            className={`px-3 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-700
                ${currentPage === page
                                    ? 'text-blue-600 bg-blue-50 dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}
              `}
                        >
                            {page}
                        </button>
                    </li>
                ))}

                {/* Next */}
                <li>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 h-8 flex items-center justify-center text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                    >
                        Next
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;
