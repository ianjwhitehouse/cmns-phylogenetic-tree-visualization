var svg = d3.select('svg');
var width = +svg.attr('width');
var height = +svg.attr('height');


d3.json('tree.json').then(function(dataset) {
    dataset.sort(function(a, b) {
        return a["parent"] <= b["parent"]
    })

    // Calc x's
    dataset.forEach(node => {
        filtered_list = dataset.filter(x => x["level"] === node["level"]);
        level_size = filtered_list.length + 1;
        node["x"] = (filtered_list.indexOf(node) + 1) * (width/level_size);
    });
    console.log(dataset);

    // Calc y's
    var max_level = 0
    dataset.forEach(node => {
        if (node.level > max_level) {
            max_level = node.level
        }
    });
    max_level += 1;


    var linkG = svg.append('g')
        .attr('class', 'links-group');

    var nodeG = svg.append('g')
        .attr('class', 'nodes-group');

    var nodeEnter = nodeG.selectAll('.node')
        .data(dataset)
        .enter()
        .append('g')
        .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + (height/max_level) * d.level + ')';
        }).on("click", function (d) {
            this.parentNode.appendChild(this);
            const rect = d3.select(this).select('rect');
            const title = d3.select(this).select('text');

            if (rect.attr("width") < 200) {
                d3.select(this).select('.g-pre-expand').attr("opacity", 0.0);
                d3.select(this).select('.g-post-expand').transition().attr("opacity", 1.0);
                make_big(rect, title, d, max_level);
            }
            else {
                d3.select(this).select('.g-pre-expand').transition().attr("opacity", 1.0);
                d3.select(this).select('.g-post-expand').attr("opacity", 0.0);
                make_small(rect, title, d, max_level);
            }
        });

    nodeEnter.append('rect')
        .attr('class', 'node')
        .attr('y', function (d) {
            return -35;
        })
        .attr("x", function (d) {
            return -90;
        })
        .attr("width", 180).attr("height", 70)
        .attr("fill", "white")

    nodeEnter.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-before-edge").attr("dy", -35).attr('class', 'node-title').text(function (d) {
        return (
            "Cluster " + d.cluster + " (" + d.mutations + " Mutations)"
        );
    });

    var pre_expand = nodeEnter.append('g').attr("class", "g-pre-expand")
    var post_expand = nodeEnter.append('g').attr("class", "g-post-expand").attr("opacity", 0.0)

    var prob_bars = pre_expand.append('g').attr('transform', 'translate(-60, 35)').attr('fill', 'blue').attr('stroke', 'black');
    prob_bars.append('rect').attr('class', 'bar').attr("x", 0).attr("width", 30).attr('height', d => 35 * d.avg_obs_freq[0]).attr('y', d => -35 * d.avg_obs_freq[0])
    prob_bars.append('rect').attr('class', 'bar').attr("x", 30).attr("width", 30).attr('height', d => 35 * d.avg_obs_freq[1]).attr('y', d => -35 * d.avg_obs_freq[1])
    prob_bars.append('rect').attr('class', 'bar').attr("x", 60).attr("width", 30).attr('height', d => 35 * d.avg_obs_freq[2]).attr('y', d => -35 * d.avg_obs_freq[2])
    prob_bars.append('rect').attr('class', 'bar').attr("x", 90).attr("width", 30).attr('height', d => 35 * d.avg_obs_freq[3]).attr('y', d => -35 * d.avg_obs_freq[3])
    prob_bars.append('line').attr("x1", 0).attr("x2", 120).attr("y1", -35).attr("y2", -35).attr('stroke-width', 2).attr('stroke', 'red');


    var linkEnter = linkG.selectAll('.link')
        .data(dataset.filter(x => x["level"] > 0))
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 6)
        .attr('y1', function (d) {
            return (height/max_level) * (d.level);
        })
        .attr('x1', function (d) {
            return d.x;
        })
        .attr('x2', function(d) {
            if (d.parent === null) {
                return d.x;
            }
            var par_d = dataset.filter(x => x["id"] === d.parent)[0]
            return par_d.x;
        })
        .attr('y2', function(d) {
            if (d.parent === null) {
                return (height/max_level) * (d.level);
            }
            var par_d = dataset.filter(x => x["id"] === d.parent)[0];
            return (height/max_level) * (par_d.level);
        })
})

function make_big(rect, title, d, max_level) {
    x = -225
    if (d.x + x < 0) {
        x = 0 - d.x
    }
    else if (d.x - x > width) {
        x = d.x - width
    }
    y = -105
    if (((height/max_level) * d.level) + y < 0) {
        y = 0 - ((height/max_level) * d.level)
    }
    else if (((height/max_level) * d.level) - y > height) {
        y = ((height/max_level) * d.level) - height
    }
    rect.transition().attr('y', y).attr("x", x).attr("width", 450).attr("height", 210)
    title.transition().attr('dy', y).attr('font-size', '32px')
}

function make_small(rect, title, d, max_level) {
    rect.transition().attr('y', function (d) {
        return -35;
    })
    .attr("x", function (d) {
        return -90;
    })
    .attr("width", 180).attr("height", 70)
    title.transition().attr('dy', -35).attr('font-size', '16px')
}