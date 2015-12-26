<?xml version='1.0'?>

<!-- 
 $Author: brischniz $
 $Header: /cvsroot/xml2owl/xsl/xml2xsd.xsl,v 1.3 2005/10/23 14:33:56 brischniz Exp $
 $Date: 2005/10/23 14:33:56 $
 $Id: xml2xsd.xsl,v 1.3 2005/10/23 14:33:56 brischniz Exp $
 $Revision: 1.3 $
 -->

<!-- 
      XML2XSD.XSL

    This stylesheet extracts an XML Schema out of an XML instance document. It is an extension of a general
    stylesheet from 'http://incrementaldevelopment.com/papers/xsltrick/#instance-to-schema'. 
    The original stylesheet has exctracted only a 'meta' schema. We adapted it, so it extracts now an XML Schema. 
    Another possibility could be Relax NG. Furthermore attribute and cardinality support has been added.
    
    Description: 
    
    The main template, which matches the root element, reviews all elements (.//*). The second template reviews
    an element and test, whether to create an element declaration or not. Because an element can appear multiple
    times, but only one element declaration should be created, only the last example of each element type triggers 
    the creation of an element declaration. In the next step, we take every element with the same name as input
    element to find all the child elements. These child elements are included in the created element declaration.
    
    The same action is made for all attributes, which can appear in the sample.
    
    We need here also support from the exslt.org extensions.
    
    
    @TODO:
        - add support for multiple input documents
        - describe the creation of the simpleContent element
        - describe the guessCardinality functionality
        - describe the ref/name mechanism
        - extend the addType template
        
-->
<xsl:stylesheet version="1.0" 
    xmlns:set="http://exslt.org/sets" 
    xmlns:exslt="http://exslt.org/common"     
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    extension-element-prefixes="set exslt">
    
    <xsl:strip-space elements="*"/>
  
    <xsl:output method="xml" indent="yes"/>
    
    <!-- 
        Parameter 'guessCardinality':
        With this parameter the stylesheet tries to 'guess' the min. and max cardinality of elements.
        Therefore it counts the appearances of the elements. The default value is set to 'false', that
        means: minCardinality="0" and maxCardinality="unbounded".
    -->
    <xsl:param name="guessCardinality" select="'false'"/>
    
    <!-- 
        Starting point. Matches the root element and reviews every element.
    -->
    <xsl:template match="/">
        <xsl:element name="xsd:schema">
            <xsl:apply-templates select="//*"/>
        </xsl:element>
    </xsl:template>
    
    
    <!-- =============================================================== -->
    <!-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
    <!-- =============================================================== -->
    
      
    <!-- 
        The main template, which matches every element
    -->
    <xsl:template match="*">
        <xsl:variable name="parent" select="name()"/>
        <xsl:variable name="parentName">
            <xsl:choose>
                <xsl:when test="contains($parent, ':')">
                    <xsl:value-of select="namespace-uri()"/>
                    <xsl:value-of select="local-name()"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="local-name()"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
            
        <!-- 
            this variable stores whether an element has child elements or not 
            @return: {true|false}
        -->
        <xsl:variable name="hasChildElements">
            <xsl:call-template name="hasChildElements">
                <xsl:with-param name="node" select="$parent"/>
            </xsl:call-template>
        </xsl:variable>
        
        <!-- 
            this variable stores whether an element has attributes or not 
            @return: {true|false}
        -->
        <xsl:variable name="hasAttributes">
            <xsl:call-template name="hasAttributes">
                <xsl:with-param name="node" select="$parent"/>
            </xsl:call-template>
        </xsl:variable>
    
        <xsl:choose>
            <!-- if element is a leaf, with no attributes -->
            <xsl:when test="$hasChildElements = 'false' and $hasAttributes = 'false'">
                <xsl:if test="count(following::*[name()=$parent]) = 0 and not(contains($parent, ':'))">
                    <xsl:element name="xsd:element">
                        <xsl:attribute name="name">
                            <xsl:value-of select="$parentName"/>
                        </xsl:attribute>
                        <xsl:call-template name="addType">
                            <xsl:with-param name="literal" select="."/>
                        </xsl:call-template>
                    </xsl:element>
                </xsl:if>
            </xsl:when>
            <xsl:otherwise>
                <!-- take the last appearance of an element in the sample -->
                <xsl:if test="count(following::*[name()=$parent]) = 0">
                    <xsl:element name="xsd:element">
                        <xsl:attribute name="name">
                            <xsl:value-of select="$parentName"/>
                        </xsl:attribute>
                        <xsl:element name="xsd:complexType">
                            
                            <xsl:if test="0 != count(//*[name()=$parent]/text())">
                                <xsl:attribute name="content">mixed</xsl:attribute>                  
                            </xsl:if>
                      
                            <xsl:choose>
                                <xsl:when test="$hasChildElements = 'true'">
                                    <xsl:element name="xsd:sequence">
                                        <xsl:call-template name="find-kids">
                                            <xsl:with-param name="parent" select="$parent"/>
                                        </xsl:call-template>
                                    </xsl:element>
                                    <xsl:if test="$hasAttributes = 'true'">
                                        <xsl:call-template name="addAttributes">
                                            <xsl:with-param name="parent" select="$parent"/>
                                        </xsl:call-template>
                                    </xsl:if>
                                </xsl:when>
                                <xsl:otherwise>
                                    <!-- simpleContent -->
                                    <xsl:if test="$hasAttributes = 'true'">
                                        <xsl:element name="xsd:simpleContent">
                                            <xsl:element name="xsd:extension">
                                                <xsl:attribute name="base">xsd:string</xsl:attribute>
                                                <xsl:call-template name="addAttributes">
                                                    <xsl:with-param name="parent" select="$parent"/>
                                                </xsl:call-template>
                                            </xsl:element>
                                        </xsl:element>
                                    </xsl:if>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:element>
                    </xsl:element>
                </xsl:if>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    
    <!-- =============================================================== -->
    <!-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
    <!-- =============================================================== -->
    
    <!-- 
        Templates adds child elements to an actual element. Important to represent the nesting.
        All child element are defined with the 'ref' attributes.
    -->
    <xsl:template name="find-kids">
        <xsl:param name="parent"/>
        <xsl:for-each select="//*[name()=$parent]/*">
            <xsl:variable name="child"><xsl:value-of select="name()"/></xsl:variable>
        
            <xsl:if test="count(following::*[name()=$child]/parent::*[name()=$parent]) = 0">
                <xsl:element name="xsd:element">
                    <!-- 
                        if the element is externally defined, the whole namespace URI is stored in 
                        the ref attribute.
                    -->
                    <xsl:attribute name="ref">
                        <xsl:choose>
                            <xsl:when test="contains($child, ':')">
                                <xsl:value-of select="namespace-uri()"/>
                                <xsl:value-of select="local-name()"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:value-of select="local-name()"/>
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:attribute>
                    <xsl:call-template name="addCardinality">
                        <xsl:with-param name="child" select="$child"/>
                        <xsl:with-param name="parent" select="$parent"></xsl:with-param>
                    </xsl:call-template>
                        <xsl:variable name="hasChildElements">
                            <xsl:call-template name="hasChildElements">
                            <xsl:with-param name="node" select="$child"/>
                        </xsl:call-template>
                    </xsl:variable>
                    <xsl:if test="$hasChildElements = 'false' and count(@*) = 0">
                        <xsl:call-template name="addType">
                            <xsl:with-param name="literal" select="."/>
                        </xsl:call-template>
                    </xsl:if>
                </xsl:element>        
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
    
    <!-- =============================================================== -->
    <!-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
    <!-- =============================================================== -->
    
      
    <!-- 
        The template tests each element wether they have child elements.
        Return value is 'true' or 'false'.
    -->
    <xsl:template name="hasChildElements">
        <xsl:param name="node"/>
        <xsl:choose>
            <xsl:when test="count(//*[name()=$node]/*) &gt; 0">
                <xsl:text>true</xsl:text>
            </xsl:when>
            <xsl:otherwise><xsl:text>false</xsl:text></xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <!-- =============================================================== -->
    <!-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
    <!-- =============================================================== -->
    
      
    <!-- 
        The template tests each element wether they have attributes or not.
        Return value is 'true' or 'false'.
    -->
    <xsl:template name="hasAttributes">
        <xsl:param name="node"/>
        <xsl:choose>
            <xsl:when test="count(//*[name() = $node]/@*) &gt; 0">
                <xsl:text>true</xsl:text>
            </xsl:when>
            <xsl:otherwise>false</xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <!-- =============================================================== -->
    <!-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
    <!-- =============================================================== -->
    
      
    <!-- 
        This template adds the attributes to the elements to which they belong.
    -->
    <xsl:template name="addAttributes">
        <xsl:param name="parent"/>
        <xsl:variable name="attributes">
            <attributes>
                <xsl:for-each select="//*[name() = $parent]/@*[not(contains(namespace-uri(), 'http://www.w3.org/2001/XMLSchema-instance'))]">
                    <att>
                        <name>
                            <!-- <xsl:if test="contains(name(), ':')">
                                <xsl:value-of select="namespace-uri()"/>
                                <xsl:text>#</xsl:text>
                            </xsl:if>-->
                            <xsl:value-of select="local-name()"/>
                        </name>
                        <value><xsl:value-of select="."/></value>
                    </att>
                </xsl:for-each>
            </attributes>
        </xsl:variable>    
        <xsl:for-each select="set:distinct(exslt:node-set($attributes)/attributes/att/name)">
            <xsl:element name="xsd:attribute">
                <xsl:choose>
                    <xsl:when test="not(contains(., ':'))">
                        <xsl:attribute name="name">
                            <xsl:value-of select="."/>
                        </xsl:attribute>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:attribute name="ref">
                            <xsl:value-of select="."/>
                        </xsl:attribute>
                    </xsl:otherwise>
                </xsl:choose>
                
                <xsl:call-template name="addType">
                    <xsl:with-param name="literal" select="../value"/>
                </xsl:call-template>
            </xsl:element>
        </xsl:for-each>
    </xsl:template>
    
    <!-- =============================================================== -->
    <!-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
    <!-- =============================================================== -->
    
      
    <!-- 
        The template adds cardinality restrictions to the elements. The parameter 'guessCardinality', if set to 'true', 
        let the stylesheet try to guess the max. and min cardinality. 
        It counts the appearances of elements. If 'false', the style set the cardinality boundaries to 
        minOccurs='0' and maxOccurs="unbounded"
    -->
    <xsl:template name="addCardinality">
        <xsl:param name="parent"/>
        <xsl:param name="child"/>
        
        <xsl:choose>
            <xsl:when test="$guessCardinality = 'false'">
                <xsl:attribute name="minOccurs">0</xsl:attribute>
                <xsl:attribute name="maxOccurs">unbounded</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>      
                <xsl:variable name="maxList">
                    <maxList>
                        <xsl:for-each select="//*[name() = $parent]">
                            <elem>
                                <name><xsl:value-of select="$child"/></name>
                                <count><xsl:value-of select="count(./*[name() = $child])"/></count>
                            </elem>
                        </xsl:for-each>
                    </maxList>
                </xsl:variable>
                <xsl:for-each select="exslt:node-set($maxList)/maxList/elem">
                    <xsl:sort order="descending" data-type="number" select="count"/>
                    <xsl:if test="position() = 1">
                        <xsl:attribute name="maxOccurs"><xsl:value-of select="count"/></xsl:attribute>
                    </xsl:if>
                    <xsl:if test="position() = last()">
                        <xsl:attribute name="minOccurs"><xsl:value-of select="count"/></xsl:attribute>
                    </xsl:if>
                </xsl:for-each>
            </xsl:otherwise>
        </xsl:choose>    
    </xsl:template>
    
    <!-- =============================================================== -->
    <!-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
    <!-- =============================================================== -->
    
    
    <!-- 
        @TODO: documentation and finish this template
    -->
    <xsl:template name="addType">
        <xsl:param name="literal"/>
        <xsl:attribute name="type">xsd:string</xsl:attribute>
    </xsl:template>
    
</xsl:stylesheet>













