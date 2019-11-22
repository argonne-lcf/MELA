
function appendLinearTimeline(data){


    var bc = d3.select("#table-rc12").node().getBoundingClientRect();

    bc.width = +bc.width + 100; // 100 is  added to account for space added by the nodelayout
    bc.height = +bc.height - 10;
    var svg = d3.select("#table-rc12").append("svg").attr("width", bc.width )
        .attr("height", bc.height);

    var margin = {top: 10, right: 10, bottom: 10, left: 40},
    margin2 = {top: 10, right: 10, bottom: 20, left: 40},
    width = +bc.width - margin.left - margin.right,
    height = +bc.height - margin.top - margin.bottom,
    height2 = +bc.height - margin2.top - margin2.bottom;

    var formatDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L%Z");

    data.forEach(function(d) {
        d.key_as_string = formatDate(d.key_as_string);
        d.doc_count = +d.doc_count;
    });

    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height2, 0]),
        y2 = d3.scaleLinear().range([height2, 0]);

    var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%B %d %Y")),
        xAxis2 = d3.axisBottom(x).tickFormat(d3.timeFormat("%B %d %Y %H:%M:%S")),
        yAxis = d3.axisLeft(y);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height2]])
        .extent([[0, 0], [width, height2]])
        .on("zoom", zoomed)
        .on("end", zoomedEnd);

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            return x(d.key_as_string);
        })
        .y0(height2)
        .y1(function (d) {
            return y(d.doc_count);
        });

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent(data, function(d) { return d.key_as_string; }));
    y.domain([0, d3.max(data, function(d) { return d.doc_count; })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    var original_domain_x = x.domain();

    focus.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area);

    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    focus.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());

    svg.append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height2)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);

    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom

        var s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    } // end of brushed

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis2);
        focus.select(".brush").call(brush.move, x.range().map(t.invertX, t));


    } //end of zoomed

    function zoomedEnd() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

        var t = d3.event.transform,
            brush_sel = d3.select(".brush rect.selection")._groups[0][0].attributes,
            start_time_x = +brush_sel.x.value,
            end_time_x = +brush_sel.width.value + start_time_x;


        var t1 = x.domain()[0], t2 = x.domain()[1];
        if(t1.toString() === original_domain_x[0].toString() && t2.toString() === original_domain_x[1].toString()){
            focus.select(".axis--x").call(xAxis);
        };

        var t3 = x.invert(start_time_x),
            t4 = x.invert(end_time_x);

        linear_time["begin"] = t3;
        linear_time["end"] = t4;

        var query = {
            "query": {
                "range" : {
                    "timestamp" : {
                        "gte": t3,
                        "lte": t4
                    }
                }
            },
            "size": 0,
            "aggs": {
                "group_by_cname_id": {
                    "terms": {
                        "field": "cname_id","order": {"_key": "asc"}
                    }
                }
            }
        };
        nodeFilters(JSON.stringify(query));
    } // end of zoomedEnd


};
