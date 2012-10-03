var cards = require('./cards');

module.exports = [
    {
        id: 'shirt-sizes',
        title: 'Shirt Sizes',
        code: 'a',
        cards: [
            {
                value: 1,
                label: 'XS'
            }, {
                value: 2,
                label: 'S'
            }, {
                value: 3,
                label: 'M'
            }, {
                value: 4,
                label: 'L'
            }, {
                value: 5,
                label: 'XL'
            },
            cards.INFINITY,
            cards.QUESTION,
            cards.BREAK
        ]
    },

    {
        id: 'sequence',
        title: 'Sequence',
        code: 'b',
        cards: [
            {
                value: 0,
                label: '0'
            }, {
                value: 1,
                label: '1'
            }, {
                value: 2,
                label: '2'
            }, {
                value: 3,
                label: '3'
            }, {
                value: 4,
                label: '4'
            }, {
                value: 5,
                label: '5'
            }, {
                value: 6,
                label: '6'
            }, {
                value: 7,
                label: '7'
            }, {
                value: 8,
                label: '8'
            }, {
                value: 9,
                label: '9'
            }, {
                value: 10,
                label: '10'
            },
            cards.INFINITY,
            cards.QUESTION,
            cards.BREAK
        ]
    },

    {
        id: 'modified-fibonacci',
        title: 'Modified Fibonacci',
        code: 'c',
        cards: [
            {
                value: 0,
                label: '0'
            }, {
                value: 0.5,
                label: "\u00BD"
            }, {
                value: 1,
                label: '1'
            }, {
                value: 2,
                label: '2'
            }, {
                value: 3,
                label: '3'
            }, {
                value: 5,
                label: '5'
            }, {
                value: 8,
                label: '8'
            }, {
                value: 13,
                label: '13'
            }, {
                value: 20,
                label: '20'
            }, {
                value: 40,
                label: '40'
            }, {
                value: 100,
                label: '100'
            },
            cards.INFINITY,
            cards.QUESTION,
            cards.BREAK
        ]
    }
];

