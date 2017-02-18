"use strict";
const SequelizeStatic = require("sequelize");
const summaryLength = 1000;
exports.itemDefinition = {
    url: {
        type: SequelizeStatic.STRING,
        allowNull: false
    },
    title: {
        type: SequelizeStatic.STRING,
        allowNull: false
    },
    author: {
        type: SequelizeStatic.STRING
    },
    summary: {
        type: SequelizeStatic.STRING(summaryLength) // eslint-disable-line new-cap
    },
    length: {
        type: SequelizeStatic.INTEGER
    },
    rating: {
        type: SequelizeStatic.FLOAT
    },
    due: {
        type: SequelizeStatic.DATE
    },
    rank: {
        type: SequelizeStatic.FLOAT
    },
    expectedRank: {
        type: SequelizeStatic.FLOAT,
        field: 'expected_rank'
    },
    categories: {
        type: SequelizeStatic.TEXT,
        allowNull: false
    }
};
exports.toItem = (item) => {
    let formattedItem = {
        id: item.id,
        url: item.url,
        title: item.title,
        author: item.author,
        summary: item.summary,
        length: item.length,
        rating: item.rating,
        due: item.due && item.due.toISOString(),
        rank: item.rank,
        expectedRank: item.expectedRank,
        categories: item.categories.length === 0 ?
            [] :
            item.categories.split(','),
        added: item.createdAt.toISOString(),
        deleted: item.deletedAt && item.deletedAt.toISOString(),
    };
    return formattedItem;
};
