function lineSedc(alldata, data, cols, dx, dy, t1, cnameid, timecols, selCols) {

    d3.select("#table-rc33 svg").remove();
    d3.select("#report-container").remove();

    d3.select("#switch").style("visibility", "visible")
    d3.select("#check-slider").on("change", function(){
            var check = d3.select(this).property("checked");
            if(check){
                d3.select("#zoom-dp").style("display", null);
            }else{
                d3.select("#zoom-dp").style("display", "none");
            }

        });

    // data holds only those sections of SEDC that are selected through clustering ensemble

    par_detailed["alldata"] = alldata;
    par_detailed["data"] = data;
    par_detailed["cols"] = cols;
    par_detailed["dx"] = dx;
    par_detailed["dy"] = dy;
    par_detailed["t1"] = t1;
    par_detailed["cnameid"] = cnameid;
    par_detailed["timecols"] = timecols;
    par_detailed["selCols"] = selCols;


    //get jobs and hwerr

    var jobs_query = sp_timestmp(t1[0], t1[1], t_header, [cnameid]);

    // set the dimensions and margins of the graph
    var wh = d3.select("#table-rc33").node().getBoundingClientRect();

    wh.height = +wh.height - 40; // leave 80 for buttons at the top

    var margin = {top: 10, right: 20, bottom: 30, left: 50},
        width = +wh.width - margin.left - margin.right,
        height = +wh.height - margin.top - margin.bottom;

    var parseT = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z");
    const parseT_formatted = (date) => {

        var dates = date.split("T");
        dates0 = dates[0].split("-");
        dates1 = dates[1].split(":");
        dates_sec = dates1[2].split("Z")[0].split(".")[0];

        return dates0[1]+"/"+dates0[2]+" "+dates1[0]+":"+dates1[1];

    };


    // set the ranges
    var x = d3.scaleTime().range([0, (width-2*margin.right)]);
    var y = d3.scaleLinear().range([height, 0]);


    var svg_ori = d3.select("#table-rc33").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "detailedLine");

    svg_ori.append("defs").append("clipPath")
        .attr("id", "clipDP")
        .append("rect")
        .attr("width", width - 2*margin.right)
        .attr("height", height);

    var svg = svg_ori.append("g")
        .attr("id","detailedPlotG")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    var m1 = data.length;

    data.forEach(function (d, i) {
        d3.range(d.length).forEach(function (c, j) {
            d[j] = +d[j];
        });
    });


    // Scale the range of the data

    x.domain([parseT(t1[0]),
        parseT(t1[1])])
    y.domain([+dx[0]-1, +dy[0]+1]);

    var original_domain_x = x.domain();

    var yRight = d3.scaleLinear()
        .range([height, 0])
        .domain([0, categs_err.length]);

    svg.append("g")
        .attr("transform", "translate("+(width-2*margin.right)+",0 )")
        .call(d3.axisRight(yRight)
            .ticks(categs_err.length + 2)
            .tickFormat(function(t){
                return t===0 ? "": categ_ticks[t];
            }));


    let lines = svg.append('g')
        .attr('class', 'lines')
        .attr('clip-path', 'url(#clipDP)');

    // Add the X Axis

    var detxAxis = d3.axisBottom(x).tickFormat(d => {
            var new_d = d.toISOString().split(".")[0]+"Z";
            return parseT_formatted(new_d);
    });

    var focus = svg.append("g")
        .attr("class", "det x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(detxAxis);


    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));


    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width-2*margin.right, height]])
        .extent([[0, 0], [width-2*margin.right, height]])
        .on("end", zoomed);



    var l = d3.line()
        .x(function (d, i) {
            return x(parseT(timecols[i]));
        })
        .y(function (d) {
            return y(d);
        });

    lines.append('g')
        .attr('class', 'line-group')
        .selectAll('.linegrey')
        .data(alldata).enter()
        .append('path')
        .attr('class', 'linegrey')
        .attr('d', function (row) {
            return l(row);
        })
        .attr('pointer-events', 'visibleStroke')
        .on("mouseover", function(d,i){
            var that = d3.mouse(this);

            appendToolTip(lines, that ,sedc_cols[i] , "path_sedc");
            appendToolTip(lines, [margin.left, margin.top+5] ,"Click to remove measurement" , "path_sedc1");

        })
        .on("mouseout", function() {
            d3.select("#path_sedc").remove();
            d3.select("#path_sedc1").remove();
        })
        .on("click", function(d,i){
            sedc_cols.splice(i,1);
            clickedEnter(sedc_cols)
        });


    var sel_l = d3.line()
        .x(function (d, i) {
            return x(parseT(selCols[i]));
        })
        .y(function (d) {
            return y(d);
        });


    //plotting scatter for selected points from PC plot
    var line_groups = lines.append('g').attr('class', 'line-group1')
        .selectAll('.linePl');


    data.forEach(data_c =>{

        line_groups
            .data(data_c).enter()
            .append('circle')
            .attr('class', 'linePl')
            .attr('r', 1.5)
            .attr("cx", function (d, i) {
                return x(parseT(selCols[i]));
            })
            .attr("cy", y);


    });



    d3.selectAll(".linePl")
        .attr('pointer-events', 'visibleStroke')
        .on("mouseover", function(d,i){
            appendToolTip(lines, d3.mouse(this) ,sedc_cols[i] , "path_sedc");
            appendToolTip(lines, [margin.left, margin.top+5] ,"Click to remove measurement" , "path_sedc1");

        })
        .on("mouseout", function() {
            d3.select("#path_sedc").remove();
            d3.select("#path_sedc1").remove();
        })
        .on("click", function(d,i){
            sedc_cols.splice(i,1);
            clickedEnter(sedc_cols)
        });


    // xaxis label
    svg.append("text")
        .attr("transform", "translate("+(width/2)+","+(height+margin.bottom)+")")
        .style("text-anchor", "middle")
        .text("Time");

    // yaxis1 label
    svg.append("text")
        .attr("transform", "translate("+(-margin.left+20)+","+(height/2)+") rotate(-90)")
        .style("text-anchor", "middle")
        .text("Environment Values");

    // yaxis2 label
    svg.append("text")
        .attr("transform", "translate("+(width + margin.right-15)+","+(height/2)+") rotate(90)")
        .style("text-anchor", "middle")
        .text("Hardware Categories");//.split("").reverse().join(""));



    svg.append("rect")
        .attr("class", "zoom-dp")
        .attr("id", "zoom-dp")
        .attr("width", width-2*margin.right)
        .attr("height", height)
        .style("fill", "none")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .style("pointer-events", "all")
        .call(zoom);


    Promise.all([query_res_jobs(JSON.stringify(jobs_query), "jobs_t100")])
        .then(function (resp_jobs) {


            var jobH = resp_jobs[0].hits.hits;
            var job_ts = [];
            var maxRangeRight = 0;
            jobH.forEach(function(d, i){
                dict = {};
                dict["ts"] = d._source['END_TIMESTAMP'];
                dict["exit_code"] = d._source['EXIT_CODE'];
                dict["LOCATION"] = d._source['LOCATION'];
                dict["CORES_REQUESTED"] = d._source['CORES_REQUESTED'];
                dict["CORES_USED"] = d._source['CORES_USED'];
                dict["START_TIMESTAMP"] = d._source['START_TIMESTAMP'];
                dict["RUNTIME_SECONDS"] = d._source['RUNTIME_SECONDS'];
                dict["WALLTIME_SECONDS"] = d._source['WALLTIME_SECONDS'];
                dict["NODES_REQUESTED"] = d._source['NODES_REQUESTED'];
                dict["NODES_USED"] = d._source['NODES_USED'];
                dict["MODE"] = d._source['MODE'];

                maxRangeRight = Math.max(maxRangeRight, d._source['LOCATION'].length);
                job_ts.push(dict);
            });

            lines.append("g")
                .attr("class", "all-jobs")
                .selectAll(".jobs-lines")
                .data(job_ts).enter()
                .append("line")
                .attr("class", "jobs-lines")
                .attr("x1", function(j){ return x(parseT(j.ts));})
                .attr("y1", y.range()[0])
                .attr("x2", function(j){ return x(parseT(j.ts));})
                .attr("y2", y.range()[1])
                .style("stroke-width", "2px")
                .style("stroke", function(j){
                    if(j.exit_code === 0)
                        return "#FFD700";
                    else
                        return "#00FFFF";
                })
                .style("fill", "none")
                .on("mouseover", function(d_j){

                    // Define the div for the tooltip
                    var div = d3.select("body").append("div")
                        .attr("class", "tooltipDet_J")
                        .attr("id", "circleJobs")
                        .style("opacity", 0);

                    div.transition()
                        .duration(200)
                        .style("opacity", .9);

                    div.html("<p>&nbsp;&nbsp;<b>START TIMESTAMP:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.START_TIMESTAMP + "<br/><br/>" +
                                "&nbsp;&nbsp;<b>END TIMESTAMP:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.ts +"<br/><br/>"+
                                "&nbsp;&nbsp;<b>RUNTIME SECONDS:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.RUNTIME_SECONDS +"<br/><br/>"+
                                "&nbsp;&nbsp;<b>WALLTIME SECONDS:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.WALLTIME_SECONDS +"<br/><br/>"+
                                "&nbsp;&nbsp;<b>NODES REQUESTED:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.NODES_REQUESTED +"<br/><br/>"+
                                "&nbsp;&nbsp;<b>NODES USED:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.NODES_USED +"<br/><br/>"+
                                "&nbsp;&nbsp;<b>CORES REQUESTED:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.CORES_REQUESTED +"<br/><br/>"+
                                "&nbsp;&nbsp;<b>CORES USED:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.CORES_USED +"<br/><br/>"+
                                "&nbsp;&nbsp;<b>EXIT CODE:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.exit_code +"<br/><br/>"+
                                "&nbsp;&nbsp;<b>MODE:</b>&nbsp;&nbsp;&nbsp;&nbsp;" +d_j.MODE +"<br/><br/>")
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 30) + "px");


                })
                .on("mouseout", function(){
                    d3.select("#circleJobs").remove();
                });

        });

    cnameid_list = d3.range(4).map(x =>  cnameid.toString().substring(0,3)+x.toString());

    client.search({
        index: 'hwerr_t89',
        type: 'error',
        body: query_hwerr_all(t1[0], t1[2], cnameid_list)
    }).then(function (resp) {

        var hwerr = resp.hits.hits,
            hwerr_ts = [],
            hwerr_formatted = [],
            hw_categs = new Set();

        var hwerr_all = [];

        hwerr.forEach(function(d1){
            hw_categs.add(d1._source.error_category_string)

            if(d1._source.data.UC === 1 && d1._source.data.PCC === 1){ // filter fatals here
                hwerr_ts.push(d1._source.timestamp);
                hwerr_formatted.push(d1._source);
            }

            var hw_not_fatal = {};
            hw_not_fatal["ts"] = d1._source.timestamp;
            hw_not_fatal["_source"] = d1._source;
            hwerr_all.push(hw_not_fatal)


        });


        lines.append("g")
            .attr("class", "all-hw")
            .selectAll(".hw-lines")
            .data(hwerr_ts).enter()
            .append("line")
            .attr("class", "hw-lines")
            .attr("x1", function(j, i){ return x(parseT(j));})
            .attr("y1", y.range()[0])
            .attr("x2", function(j, i){ return x(parseT(j));})
            .attr("y2", y.range()[1])
            .style("stroke-width", "1.5px")
            .style("stroke", "red")
            .style("fill", "none")
            .on("mouseover", function(d){
                var that = d3.select(this);
                var ts_hw = x.invert(that.attr("x1"));
                appendToolTip(lines, d3.mouse(this) ,parseT_formatted(ts_hw.toISOString()), "hwjobs");
            })
            .on("mouseout", function(){
                d3.select("#hwjobs").remove();
            });


        //adding rest of the hw errors

        lines.append("g").attr("class", "circleOuterContainer")
            .selectAll(".circle.black")
            .data(hwerr_all)
            .enter()
            .append("circle")
            .attr("class", "circle black")
            .attr("cx",function(d){

                return x(parseT(d.ts))})
            .attr("cy",function(d, i){
                var categ = d._source.error_category_string;
                return yRight(categs_err.indexOf(categ));})
            .attr("fill","blue")
            .style("opacity", "1")
            .attr("r",5);

        lines.append("g").attr("class", "circleInnerContainer")
            .selectAll(".circle.white")
            .data(hwerr_all)
            .enter()
            .append("circle")
            .attr("class", "circle white")
            .attr("cx",function(d){return x(parseT(d.ts))})
            .attr("cy",function(d){
                var categ = d._source.error_category_string;
                return yRight(categs_err.indexOf(categ));})
            .attr("fill","steelblue")
            .style("opacity", "1")
            .attr("r",3)
            .on("mouseover", function(d2){

                var that = d3.select(this),
                    d1 = d2._source;
                // Define the div for the tooltip
                var div = d3.select("body").append("div")
                    .attr("class", "tooltipDet")
                    .attr("id", "circleHwerr")
                    .style("opacity", 0);

                div.transition()
                    .duration(200)
                    .style("opacity", .9);

                div	.html("<p>&nbsp;&nbsp;<b>TIMESTAMP:</b>&nbsp;&nbsp;&nbsp;" +x.invert(that.attr("cx")).toISOString() + "<br/><br/>" +
                             "&nbsp;&nbsp;<b>CNAME:</b>&nbsp;&nbsp;&nbsp;" +d1.cname +"<br/><br/>"+
                             "&nbsp;&nbsp;<b>ERROR CATEGORY:</b>&nbsp;&nbsp;&nbsp;<br/>" + d1.error_category_string +"<br/><br/>" +
                             "&nbsp;&nbsp;<b>NODE TYPE:</b>&nbsp;&nbsp;&nbsp;" + d1.node_type+"</p><br/>")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 30) + "px");


            })
            .on("mouseout", function(){
                d3.select("#circleHwerr").remove();
            });


        //legend for detailed plot
        var rad = 5;
        var leg = svg.append("g")
            .attr("class","detLegend");

        margin.top = 5;

        leg.append("rect")
            .attr("x", (width - 10*margin.right - 10))
            .attr("y", margin.top - 8)
            .attr('width', 8*margin.right)
            .attr("height", 11*margin.top + 2*rad)
            .style("fill", "white")
            .style("stroke-width", "1px")
            .style("opacity", 1)
            .style("stroke", "black");

        leg.selectAll(".dotLegend")
            .data(d3.range(2)).enter()
            .append("circle")
            .attr("class", "dotLegend")
            .attr("cx", (width - 9.5 *margin.right))
            .attr("cy", margin.top)
            .attr("r", d => (d === 0 ? rad : 3))
            .style("fill-opacity", "0.8")
            .style("fill", d => (d === 0 ? "blue" : "steelblue"));


        var lineLegends = leg.selectAll("line")
            .data(d3.range(1)).enter();

            d3.range(3).forEach((l, ind) => {

                lineLegends.append("line")
                    .attr("class", "dotLegend")
                    .attr("x1", (width - 10*margin.right))
                    .attr("y1", _ => ((ind+1) * (margin.top + 2 * rad) + 5))
                    .attr("x2", (width - 10*margin.right+ 5*rad)) // 10 is twice the radius
                    .attr("y2", _ => ((ind+1) * (margin.top + 2 * rad) + 5))
                    .style("stroke-width", "2px")
                    .style("opacity", "1")
                    .style("stroke", _ => (ind===0 ? "red": ind===1? "#00FFFF": "#FFD700"));

            });


            var textLegends = leg.selectAll("text")
                .data(d3.range(4)).enter();

                d3.range(4).forEach((l, ind) => {

                    textLegends.append("text")
                        .attr("class", "textLegend")
                        .attr("x", (width - 8.5 * margin.right))
                        .attr("y", ((ind+1) * (margin.top + rad ) + (ind * rad) ))
                        .attr('text-anchor', 'left')
                        .style("fill", "black")
                        .style("font-size", "11px")
                        .text(_ => (ind===0? "Hardware Log Data": (ind===1)? "Fatal MCE Error":
                            (ind===2)? "Job Exit Code != 0": "Job Exit Code = 0"));

            });

    });


    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;

        if(t.k === 1 && t.x<=0 && t.y<=0){
            x.domain(original_domain_x);
        }else
            x.domain(t.rescaleX(x).domain());

        focus.call(detxAxis);

        lines.selectAll(".linegrey").attr("d", l);
        line_groups = lines.selectAll(".linePl");

        line_groups.attr("cx", function (d, i) {
            var len = data[0].length;
            return x(parseT(selCols[i%len]));
        });


        d3.selectAll(".jobs-lines")
            .attr("x1", function(d){ return  x(parseT(d.ts))})
            .attr("x2", function(d){ return  x(parseT(d.ts))});

        d3.selectAll(".hw-lines")
            .attr("x1", function(d){ return  x(parseT(d))})
            .attr("x2", function(d){ return  x(parseT(d))});

        d3.selectAll(".circle.white").attr("cx", function(d){ return x(parseT(d.ts))});
        d3.selectAll(".circle.black").attr("cx", function(d){ return x(parseT(d.ts))});

    }



    function appendToolTip(svg, node, msg, id){

        svg.append("text")
            .attr("id", "tooltipNode_det")
            .attr("class", "texts tooltip")
            .attr("id", id)
            .attr("x", function () {

                return parseInt(node[0])-10;
            })
            .attr("y", function () {
                return parseInt(node[1])-10;
            })
            .style("font-weight", "normal")
            .style("font-size", "11px")
            .style("fill", "black")
            .text(function (d1, i) {
                return msg;
            })

    };


    d3.select("#detailed_plt").attr("disabled", "")
        .style("visibility", "visible").style("background-color","#c5c5c5");

    d3.select("#timeline_zoom").attr("disabled", null)
        .style("visibility", "visible").style("background-color","white")
        .on("click", function(){
            zoomTimeLine(5);
        });

};

