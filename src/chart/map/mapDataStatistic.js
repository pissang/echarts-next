define(function (require) {

    var zrUtil = require('zrender/core/util');

    // FIXME 公用？
    /**
     * @param {Array.<module:echarts/data/List>} datas
     * @param {string} statisticsType 'average' 'sum'
     * @inner
     */
    function dataStatistics(datas, statisticsType) {
        var dataNameMap = {};
        var dims = ['value'];

        for (var i = 0; i < datas.length; i++) {
            datas[i].each(dims, function (value, idx) {
                var name = datas[i].getName(idx);
                dataNameMap[name] = dataNameMap[name] || [];
                if (!isNaN(value)) {
                    dataNameMap[name].push(value);
                }
            });
        }

        return datas[0].map(dims, function (value, idx) {
            var name = datas[0].getName(idx);
            var sum = 0;
            var len = dataNameMap[name].length;
            for (var i = 0; i < len; i++) {
                sum += dataNameMap[name][i];
            }
            if (statisticsType === 'average') {
                sum /= len;
            }
            return len === 0 ? NaN : sum;
        });
    }

    return function (ecModel) {
        var seriesGroupByMapType = {};
        ecModel.eachSeriesByType('map', function (seriesModel) {
            var mapType = seriesModel.get('map');
            seriesGroupByMapType[mapType] = seriesGroupByMapType[mapType] || [];
            seriesGroupByMapType[mapType].push(seriesModel);
        });

        zrUtil.each(seriesGroupByMapType, function (seriesList, mapType) {
            var data = dataStatistics(
                zrUtil.map(seriesList, function (seriesModel) {
                    return seriesModel.getData();
                }),
                seriesList[0].get('mapValueCalculation')
            );

            seriesList[0].seriesGroup = [];

            seriesList[0].setData(data);

            // FIXME Put where?
            for (var i = 0; i < seriesList.length; i++) {
                seriesList[i].seriesGroup = seriesList;
                seriesList[i].needsDrawMap = i === 0;
            }
        });
    };
});